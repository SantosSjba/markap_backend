import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionPurchaseOrderPayload,
  ListProduccionPurchaseOrdersFilters,
  ListProduccionPurchaseOrdersResult,
  ProduccionPurchaseOrderDetail,
  ProduccionPurchaseOrderLineDto,
  ProduccionPurchaseOrderRepository,
  ProduccionPurchaseOrderStatus,
  ReceiveProduccionPurchaseOrderPayload,
  UpdateProduccionPurchaseOrderPayload,
} from '@domain/repositories/produccion-purchase-order.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeStatus(lines: { quantityOrdered: Prisma.Decimal; quantityReceived: Prisma.Decimal }[]): ProduccionPurchaseOrderStatus {
  if (lines.length === 0) return 'DRAFT';
  const allReceived = lines.every((l) => num(l.quantityReceived) >= num(l.quantityOrdered));
  const anyReceived = lines.some((l) => num(l.quantityReceived) > 0);
  if (allReceived) return 'RECEIVED';
  if (anyReceived) return 'PARTIAL';
  return 'SENT';
}

@Injectable()
export class ProduccionPurchaseOrderPrismaRepository implements ProduccionPurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapLine(row: {
    id: string;
    materialId: string;
    quantityOrdered: Prisma.Decimal;
    quantityReceived: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    material: { code: string; name: string; unit: string };
  }): ProduccionPurchaseOrderLineDto {
    const ordered = num(row.quantityOrdered);
    const received = num(row.quantityReceived);
    const unitPrice = num(row.unitPrice);
    return {
      id: row.id,
      materialId: row.materialId,
      materialCode: row.material.code,
      materialName: row.material.name,
      unit: row.material.unit,
      quantityOrdered: ordered,
      quantityReceived: received,
      quantityPending: Math.max(0, ordered - received),
      unitPrice,
      lineTotal: ordered * unitPrice,
    };
  }

  private async nextCode(applicationId: string): Promise<string> {
    const count = await this.prisma.produccionPurchaseOrder.count({ where: { applicationId } });
    const year = new Date().getFullYear();
    return `OC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async loadDetail(id: string): Promise<ProduccionPurchaseOrderDetail | null> {
    const row = await this.prisma.produccionPurchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { companyName: true, ruc: true } },
        lines: {
          include: { material: { select: { code: true, name: true, unit: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!row) return null;

    const lines = row.lines.map((l) => this.mapLine(l));
    const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionPurchaseOrderStatus,
      supplierId: row.supplierId,
      supplierName: row.supplier.companyName,
      supplierRuc: row.supplier.ruc,
      orderedAt: row.orderedAt.toISOString(),
      expectedAt: row.expectedAt?.toISOString() ?? null,
      notes: row.notes,
      lines,
      totalAmount: Math.round(totalAmount * 100) / 100,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private validateLines(lines: { materialId: string; quantityOrdered: number; unitPrice: number }[]) {
    if (!lines.length) throw new BadRequestException('La orden debe tener al menos una línea');
    for (const l of lines) {
      if (l.quantityOrdered <= 0) throw new BadRequestException('Cantidad ordenada debe ser positiva');
      if (l.unitPrice < 0) throw new BadRequestException('Precio unitario inválido');
    }
  }

  async list(filters: ListProduccionPurchaseOrdersFilters): Promise<ListProduccionPurchaseOrdersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionPurchaseOrderWhereInput[] = [{ applicationId: app.id }];
    if (filters.status) andParts.push({ status: filters.status });
    if (filters.supplierId) andParts.push({ supplierId: filters.supplierId });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { supplier: { companyName: { contains: q, mode: 'insensitive' } } },
          { notes: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionPurchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { companyName: true } },
          lines: { select: { quantityOrdered: true, unitPrice: true } },
        },
        orderBy: { orderedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionPurchaseOrder.count({ where }),
    ]);

    return {
      data: rows.map((r) => {
        const totalAmount = r.lines.reduce(
          (s, l) => s + num(l.quantityOrdered) * num(l.unitPrice),
          0,
        );
        return {
          id: r.id,
          code: r.code,
          status: r.status as ProduccionPurchaseOrderStatus,
          supplierId: r.supplierId,
          supplierName: r.supplier.companyName,
          orderedAt: r.orderedAt.toISOString(),
          expectedAt: r.expectedAt?.toISOString() ?? null,
          linesCount: r.lines.length,
          totalAmount: Math.round(totalAmount * 100) / 100,
          updatedAt: r.updatedAt.toISOString(),
        };
      }),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionPurchaseOrderDetail | null> {
    const row = await this.prisma.produccionPurchaseOrder.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  async create(applicationId: string, payload: CreateProduccionPurchaseOrderPayload) {
    this.validateLines(payload.lines);

    const supplier = await this.prisma.produccionSupplier.findFirst({
      where: { id: payload.supplierId, applicationId },
    });
    if (!supplier) throw new BadRequestException('Proveedor no encontrado');

    const materialIds = payload.lines.map((l) => l.materialId);
    const materials = await this.prisma.produccionMaterial.findMany({
      where: { id: { in: materialIds }, applicationId },
    });
    if (materials.length !== new Set(materialIds).size) {
      throw new BadRequestException('Uno o más materiales no son válidos');
    }

    const code = await this.nextCode(applicationId);
    const orderedAt = payload.orderedAt ? new Date(payload.orderedAt) : new Date();

    const row = await this.prisma.produccionPurchaseOrder.create({
      data: {
        applicationId,
        supplierId: payload.supplierId,
        code,
        status: 'DRAFT',
        orderedAt,
        expectedAt: payload.expectedAt ? new Date(payload.expectedAt) : null,
        notes: payload.notes?.trim() || null,
        lines: {
          create: payload.lines.map((l) => ({
            materialId: l.materialId,
            quantityOrdered: new Prisma.Decimal(l.quantityOrdered),
            quantityReceived: new Prisma.Decimal(0),
            unitPrice: new Prisma.Decimal(l.unitPrice),
          })),
        },
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear orden');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionPurchaseOrderPayload) {
    const order = await this.prisma.produccionPurchaseOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Orden no encontrada');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden editar órdenes en borrador');
    }

    if (payload.lines) this.validateLines(payload.lines);

    if (payload.supplierId) {
      const supplier = await this.prisma.produccionSupplier.findFirst({
        where: { id: payload.supplierId, applicationId: order.applicationId },
      });
      if (!supplier) throw new BadRequestException('Proveedor no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      const patch: Prisma.ProduccionPurchaseOrderUncheckedUpdateInput = {};
      if (payload.supplierId !== undefined) patch.supplierId = payload.supplierId;
      if (payload.orderedAt !== undefined) patch.orderedAt = new Date(payload.orderedAt);
      if (payload.expectedAt !== undefined) {
        patch.expectedAt = payload.expectedAt ? new Date(payload.expectedAt) : null;
      }
      if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;

      await tx.produccionPurchaseOrder.update({ where: { id }, data: patch });

      if (payload.lines) {
        await tx.produccionPurchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
        await tx.produccionPurchaseOrderLine.createMany({
          data: payload.lines.map((l) => ({
            purchaseOrderId: id,
            materialId: l.materialId,
            quantityOrdered: new Prisma.Decimal(l.quantityOrdered),
            quantityReceived: new Prisma.Decimal(0),
            unitPrice: new Prisma.Decimal(l.unitPrice),
          })),
        });
      }
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Orden no encontrada');
    return detail;
  }

  async send(id: string) {
    const order = await this.prisma.produccionPurchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) throw new BadRequestException('Orden no encontrada');
    if (order.status !== 'DRAFT') throw new BadRequestException('Solo se pueden enviar órdenes en borrador');
    if (!order.lines.length) throw new BadRequestException('La orden no tiene líneas');

    await this.prisma.produccionPurchaseOrder.update({
      where: { id },
      data: { status: 'SENT' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Orden no encontrada');
    return detail;
  }

  async receive(id: string, payload: ReceiveProduccionPurchaseOrderPayload) {
    if (!payload.lines?.length) throw new BadRequestException('Indique las líneas a recibir');

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.produccionPurchaseOrder.findUnique({
        where: { id },
        include: {
          lines: { include: { material: true } },
        },
      });
      if (!order) throw new BadRequestException('Orden no encontrada');
      if (!['SENT', 'PARTIAL'].includes(order.status)) {
        throw new BadRequestException('La orden no está pendiente de recepción');
      }

      const lineById = new Map(order.lines.map((l) => [l.id, l]));

      for (const item of payload.lines) {
        const line = lineById.get(item.lineId);
        if (!line) throw new BadRequestException(`Línea ${item.lineId} no encontrada`);
        if (item.quantity <= 0) throw new BadRequestException('Cantidad a recibir debe ser positiva');

        const pending = num(line.quantityOrdered) - num(line.quantityReceived);
        if (item.quantity > pending + 0.0001) {
          throw new BadRequestException(
            `Cantidad excede lo pendiente en ${line.material.code}`,
          );
        }

        const newReceived = num(line.quantityReceived) + item.quantity;
        await tx.produccionPurchaseOrderLine.update({
          where: { id: line.id },
          data: { quantityReceived: new Prisma.Decimal(newReceived) },
        });

        const material = line.material;
        const current = num(material.currentStock);
        const balanceAfter = current + item.quantity;

        await tx.produccionMaterial.update({
          where: { id: material.id },
          data: {
            currentStock: new Prisma.Decimal(balanceAfter),
            unitCost: line.unitPrice,
          },
        });

        await tx.produccionStockMovement.create({
          data: {
            materialId: material.id,
            movementType: 'IN',
            quantity: new Prisma.Decimal(item.quantity),
            balanceAfter: new Prisma.Decimal(balanceAfter),
            unitCost: line.unitPrice,
            reference: order.code,
            notes: payload.notes?.trim() || `Recepción OC ${order.code}`,
          },
        });
      }

      const updatedLines = await tx.produccionPurchaseOrderLine.findMany({
        where: { purchaseOrderId: id },
      });
      const newStatus = computeStatus(updatedLines);
      await tx.produccionPurchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Orden no encontrada');
    return detail;
  }

  async cancel(id: string) {
    const order = await this.prisma.produccionPurchaseOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Orden no encontrada');
    if (!['DRAFT', 'SENT'].includes(order.status)) {
      throw new BadRequestException('No se puede cancelar esta orden');
    }

    await this.prisma.produccionPurchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Orden no encontrada');
    return detail;
  }

  async delete(id: string): Promise<void> {
    const order = await this.prisma.produccionPurchaseOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Orden no encontrada');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden eliminar órdenes en borrador');
    }
    await this.prisma.produccionPurchaseOrder.delete({ where: { id } });
  }
}
