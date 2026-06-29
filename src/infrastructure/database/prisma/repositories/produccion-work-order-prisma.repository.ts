import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  PRODUCCION_DEFAULT_STAGES,
  type ConsumeProduccionWorkOrderMaterialPayload,
  type CreateProduccionWorkOrderPayload,
  type ListProduccionWorkOrdersFilters,
  type ListProduccionWorkOrdersResult,
  type ProduccionWorkOrderDetail,
  type ProduccionWorkOrderListItem,
  type ProduccionWorkOrderMaterialConsumptionDto,
  type ProduccionWorkOrderRepository,
  type ProduccionWorkOrderStageDto,
  type ProduccionWorkOrderStageStatus,
  type ProduccionWorkOrderStats,
  type ProduccionWorkOrderStatus,
  type UpdateProduccionWorkOrderPayload,
  type UpdateProduccionWorkOrderStagePayload,
} from '@domain/repositories/produccion-work-order.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function recalcProgress(stages: { status: string }[]): number {
  if (!stages.length) return 0;
  const done = stages.filter((s) => s.status === 'DONE').length;
  return Math.round((done / stages.length) * 10000) / 100;
}

@Injectable()
export class ProduccionWorkOrderPrismaRepository implements ProduccionWorkOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapStage(row: {
    id: string;
    stageKey: string;
    label: string;
    sortOrder: number;
    status: string;
    assignee: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    notes: string | null;
  }): ProduccionWorkOrderStageDto {
    return {
      id: row.id,
      stageKey: row.stageKey,
      label: row.label,
      sortOrder: row.sortOrder,
      status: row.status as ProduccionWorkOrderStageStatus,
      assignee: row.assignee,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      notes: row.notes,
    };
  }

  private mapConsumption(row: {
    id: string;
    materialId: string;
    quantity: Prisma.Decimal;
    notes: string | null;
    consumedAt: Date;
    material: { code: string; name: string };
  }): ProduccionWorkOrderMaterialConsumptionDto {
    return {
      id: row.id,
      materialId: row.materialId,
      materialCode: row.material.code,
      materialName: row.material.name,
      quantity: num(row.quantity),
      notes: row.notes,
      consumedAt: row.consumedAt.toISOString(),
    };
  }

  private async nextCode(applicationId: string): Promise<string> {
    const count = await this.prisma.produccionWorkOrder.count({ where: { applicationId } });
    const year = new Date().getFullYear();
    return `OT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async loadDetail(id: string): Promise<ProduccionWorkOrderDetail | null> {
    const row = await this.prisma.produccionWorkOrder.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } },
        lines: {
          include: { furniture: { select: { code: true, name: true } } },
          orderBy: { id: 'asc' },
        },
        stages: { orderBy: { sortOrder: 'asc' } },
        consumptions: {
          include: { material: { select: { code: true, name: true } } },
          orderBy: { consumedAt: 'desc' },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionWorkOrderStatus,
      priority: row.priority as ProduccionWorkOrderDetail['priority'],
      currentStageKey: row.currentStageKey,
      progressPercent: num(row.progressPercent),
      clientId: row.clientId,
      clientName: row.client?.fullName ?? null,
      assignedTo: row.assignedTo,
      scheduledStart: row.scheduledStart?.toISOString() ?? null,
      scheduledEnd: row.scheduledEnd?.toISOString() ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      notes: row.notes,
      lines: row.lines.map((l) => ({
        id: l.id,
        furnitureId: l.furnitureId,
        furnitureCode: l.furniture.code,
        furnitureName: l.furniture.name,
        quantity: num(l.quantity),
        notes: l.notes,
      })),
      stages: row.stages.map((s) => this.mapStage(s)),
      consumptions: row.consumptions.map((c) => this.mapConsumption(c)),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapListItem(row: {
    id: string;
    code: string;
    status: string;
    priority: string;
    currentStageKey: string | null;
    progressPercent: Prisma.Decimal;
    clientId: string | null;
    assignedTo: string | null;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    updatedAt: Date;
    client: { fullName: string } | null;
    lines: { furniture: { name: string }; quantity: Prisma.Decimal }[];
    stages: { stageKey: string; label: string; status: string }[];
  }): ProduccionWorkOrderListItem {
    const currentStage = row.stages.find((s) => s.stageKey === row.currentStageKey);
    const furnitureSummary = row.lines
      .map((l) => `${l.furniture.name}×${num(l.quantity)}`)
      .join(', ');

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionWorkOrderStatus,
      priority: row.priority as ProduccionWorkOrderListItem['priority'],
      currentStageKey: row.currentStageKey,
      currentStageLabel: currentStage?.label ?? null,
      progressPercent: num(row.progressPercent),
      clientId: row.clientId,
      clientName: row.client?.fullName ?? null,
      furnitureSummary,
      assignedTo: row.assignedTo,
      scheduledStart: row.scheduledStart?.toISOString() ?? null,
      scheduledEnd: row.scheduledEnd?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionWorkOrdersFilters): Promise<ListProduccionWorkOrdersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionWorkOrderWhereInput[] = [{ applicationId: app.id }];
    if (filters.status) andParts.push({ status: filters.status });
    if (filters.stageKey) andParts.push({ currentStageKey: filters.stageKey });
    if (filters.clientId) andParts.push({ clientId: filters.clientId });
    if (filters.priority) andParts.push({ priority: filters.priority });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { assignedTo: { contains: q, mode: 'insensitive' } },
          { client: { fullName: { contains: q, mode: 'insensitive' } } },
          { lines: { some: { furniture: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionWorkOrder.findMany({
        where,
        include: {
          client: { select: { fullName: true } },
          lines: { include: { furniture: { select: { name: true } } } },
          stages: { select: { stageKey: true, label: true, status: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionWorkOrder.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapListItem(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<ProduccionWorkOrderStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug.trim() },
    });
    if (!app) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, byStage: [] };
    }

    const rows = await this.prisma.produccionWorkOrder.findMany({
      where: { applicationId: app.id, status: 'IN_PROGRESS' },
      select: { currentStageKey: true },
    });

    const byStageMap = new Map<string, number>();
    for (const r of rows) {
      if (r.currentStageKey) {
        byStageMap.set(r.currentStageKey, (byStageMap.get(r.currentStageKey) ?? 0) + 1);
      }
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      this.prisma.produccionWorkOrder.count({ where: { applicationId: app.id } }),
      this.prisma.produccionWorkOrder.count({ where: { applicationId: app.id, status: 'PENDING' } }),
      this.prisma.produccionWorkOrder.count({ where: { applicationId: app.id, status: 'IN_PROGRESS' } }),
      this.prisma.produccionWorkOrder.count({ where: { applicationId: app.id, status: 'COMPLETED' } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      byStage: PRODUCCION_DEFAULT_STAGES.map((s) => ({
        stageKey: s.stageKey,
        label: s.label,
        count: byStageMap.get(s.stageKey) ?? 0,
      })),
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionWorkOrderDetail | null> {
    const row = await this.prisma.produccionWorkOrder.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  private validateLines(lines: { furnitureId: string; quantity?: number }[]) {
    if (!lines.length) throw new BadRequestException('La OT debe incluir al menos un mueble');
    for (const l of lines) {
      if ((l.quantity ?? 1) <= 0) throw new BadRequestException('Cantidad inválida');
    }
  }

  async create(applicationId: string, payload: CreateProduccionWorkOrderPayload) {
    this.validateLines(payload.lines);

    if (payload.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: payload.clientId, applicationId },
      });
      if (!client) throw new BadRequestException('Cliente no encontrado');
    }

    const furnitureIds = payload.lines.map((l) => l.furnitureId);
    const furniture = await this.prisma.produccionFurniture.findMany({
      where: { id: { in: furnitureIds }, applicationId },
    });
    if (furniture.length !== new Set(furnitureIds).size) {
      throw new BadRequestException('Uno o más muebles no son válidos');
    }

    const code = await this.nextCode(applicationId);
    const row = await this.prisma.produccionWorkOrder.create({
      data: {
        applicationId,
        code,
        clientId: payload.clientId?.trim() || null,
        status: 'PENDING',
        priority: payload.priority ?? 'NORMAL',
        currentStageKey: PRODUCCION_DEFAULT_STAGES[0].stageKey,
        progressPercent: new Prisma.Decimal(0),
        assignedTo: payload.assignedTo?.trim() || null,
        scheduledStart: payload.scheduledStart ? new Date(payload.scheduledStart) : null,
        scheduledEnd: payload.scheduledEnd ? new Date(payload.scheduledEnd) : null,
        notes: payload.notes?.trim() || null,
        lines: {
          create: payload.lines.map((l) => ({
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity ?? 1),
            notes: l.notes?.trim() || null,
          })),
        },
        stages: {
          create: PRODUCCION_DEFAULT_STAGES.map((s) => ({
            stageKey: s.stageKey,
            label: s.label,
            sortOrder: s.sortOrder,
            status: 'PENDING',
          })),
        },
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear OT');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionWorkOrderPayload) {
    const order = await this.prisma.produccionWorkOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden editar OT pendientes');
    }
    if (payload.lines) this.validateLines(payload.lines);

    await this.prisma.$transaction(async (tx) => {
      const patch: Prisma.ProduccionWorkOrderUncheckedUpdateInput = {};
      if (payload.clientId !== undefined) patch.clientId = payload.clientId?.trim() || null;
      if (payload.priority !== undefined) patch.priority = payload.priority;
      if (payload.assignedTo !== undefined) patch.assignedTo = payload.assignedTo?.trim() || null;
      if (payload.scheduledStart !== undefined) {
        patch.scheduledStart = payload.scheduledStart ? new Date(payload.scheduledStart) : null;
      }
      if (payload.scheduledEnd !== undefined) {
        patch.scheduledEnd = payload.scheduledEnd ? new Date(payload.scheduledEnd) : null;
      }
      if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;

      await tx.produccionWorkOrder.update({ where: { id }, data: patch });

      if (payload.lines) {
        await tx.produccionWorkOrderLine.deleteMany({ where: { workOrderId: id } });
        await tx.produccionWorkOrderLine.createMany({
          data: payload.lines.map((l) => ({
            workOrderId: id,
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity ?? 1),
            notes: l.notes?.trim() || null,
          })),
        });
      }
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async start(id: string) {
    const order = await this.prisma.produccionWorkOrder.findUnique({
      where: { id },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (order.status !== 'PENDING') throw new BadRequestException('La OT ya fue iniciada');

    const first = order.stages[0];
    if (!first) throw new BadRequestException('La OT no tiene etapas');

    await this.prisma.$transaction(async (tx) => {
      await tx.produccionWorkOrderStage.update({
        where: { id: first.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
      await tx.produccionWorkOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          currentStageKey: first.stageKey,
          startedAt: new Date(),
        },
      });
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async updateStage(id: string, stageId: string, payload: UpdateProduccionWorkOrderStagePayload) {
    const order = await this.prisma.produccionWorkOrder.findUnique({
      where: { id },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (!['PENDING', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('La OT no admite cambios de etapa');
    }

    const stageIdx = order.stages.findIndex((s) => s.id === stageId);
    if (stageIdx < 0) throw new BadRequestException('Etapa no encontrada');
    const stage = order.stages[stageIdx];

    await this.prisma.$transaction(async (tx) => {
      const stagePatch: Prisma.ProduccionWorkOrderStageUncheckedUpdateInput = {};
      if (payload.assignee !== undefined) stagePatch.assignee = payload.assignee?.trim() || null;
      if (payload.notes !== undefined) stagePatch.notes = payload.notes?.trim() || null;

      if (payload.markDone) {
        if (stage.status === 'DONE') return;
        stagePatch.status = 'DONE';
        stagePatch.completedAt = new Date();
        if (!stage.startedAt) stagePatch.startedAt = new Date();

        const next = order.stages[stageIdx + 1];
        if (next) {
          await tx.produccionWorkOrderStage.update({
            where: { id: next.id },
            data: {
              status: 'IN_PROGRESS',
              startedAt: next.startedAt ?? new Date(),
            },
          });
        }
      } else if (stage.status === 'PENDING' && order.status === 'IN_PROGRESS') {
        stagePatch.status = 'IN_PROGRESS';
        stagePatch.startedAt = new Date();
      }

      await tx.produccionWorkOrderStage.update({ where: { id: stageId }, data: stagePatch });

      const updatedStages = await tx.produccionWorkOrderStage.findMany({
        where: { workOrderId: id },
        orderBy: { sortOrder: 'asc' },
      });

      const progress = recalcProgress(updatedStages);
      const active = updatedStages.find((s) => s.status === 'IN_PROGRESS');
      const allDone = updatedStages.every((s) => s.status === 'DONE');

      const woPatch: Prisma.ProduccionWorkOrderUncheckedUpdateInput = {
        progressPercent: new Prisma.Decimal(progress),
        currentStageKey: active?.stageKey ?? updatedStages[updatedStages.length - 1]?.stageKey,
      };

      if (allDone && order.status === 'IN_PROGRESS') {
        woPatch.status = 'COMPLETED';
        woPatch.completedAt = new Date();
      }

      await tx.produccionWorkOrder.update({ where: { id }, data: woPatch });
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async complete(id: string) {
    const order = await this.prisma.produccionWorkOrder.findUnique({
      where: { id },
      include: { stages: true },
    });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (order.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Solo OT en proceso pueden completarse');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      for (const s of order.stages) {
        await tx.produccionWorkOrderStage.update({
          where: { id: s.id },
          data: {
            status: 'DONE',
            startedAt: s.startedAt ?? now,
            completedAt: now,
          },
        });
      }
      await tx.produccionWorkOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          progressPercent: new Prisma.Decimal(100),
          completedAt: now,
          currentStageKey: order.stages[order.stages.length - 1]?.stageKey,
        },
      });
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async cancel(id: string) {
    const order = await this.prisma.produccionWorkOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (!['PENDING', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('No se puede cancelar esta OT');
    }

    await this.prisma.produccionWorkOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async consumeMaterials(id: string, items: ConsumeProduccionWorkOrderMaterialPayload[]) {
    if (!items.length) throw new BadRequestException('Indique materiales a consumir');

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.produccionWorkOrder.findUnique({ where: { id } });
      if (!order) throw new BadRequestException('OT no encontrada');
      if (!['IN_PROGRESS'].includes(order.status)) {
        throw new BadRequestException('Solo OT en proceso pueden consumir materiales');
      }

      for (const item of items) {
        if (item.quantity <= 0) throw new BadRequestException('Cantidad inválida');

        const material = await tx.produccionMaterial.findFirst({
          where: { id: item.materialId, applicationId: order.applicationId },
        });
        if (!material) throw new BadRequestException('Material no encontrado');

        const current = num(material.currentStock);
        const balanceAfter = current - item.quantity;
        if (balanceAfter < 0) {
          throw new BadRequestException(`Stock insuficiente: ${material.code}`);
        }

        await tx.produccionMaterial.update({
          where: { id: material.id },
          data: { currentStock: new Prisma.Decimal(balanceAfter) },
        });

        await tx.produccionStockMovement.create({
          data: {
            materialId: material.id,
            movementType: 'OUT',
            quantity: new Prisma.Decimal(item.quantity),
            balanceAfter: new Prisma.Decimal(balanceAfter),
            unitCost: material.unitCost,
            reference: order.code,
            notes: item.notes?.trim() || `Consumo OT ${order.code}`,
          },
        });

        await tx.produccionWorkOrderMaterialConsumption.create({
          data: {
            workOrderId: id,
            materialId: material.id,
            quantity: new Prisma.Decimal(item.quantity),
            notes: item.notes?.trim() || null,
          },
        });
      }
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('OT no encontrada');
    return detail;
  }

  async delete(id: string): Promise<void> {
    const order = await this.prisma.produccionWorkOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('OT no encontrada');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden eliminar OT pendientes');
    }
    await this.prisma.produccionWorkOrder.delete({ where: { id } });
  }
}
