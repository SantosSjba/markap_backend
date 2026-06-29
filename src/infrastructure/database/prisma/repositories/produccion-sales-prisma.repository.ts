import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PRODUCCION_CONFIG_REPOSITORY,
  PRODUCCION_ORDER_REPOSITORY,
} from '@common/constants/injection-tokens';
import { PRODUCCION_NUMBERING_SERIES_KEYS } from '@domain/constants/produccion-config.defaults';
import type { ProduccionConfigRepository } from '@domain/repositories/produccion-config.repository';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionDeliveryPayload,
  CreateProduccionOrderPayload,
  CreateProduccionQuotationPayload,
  ListProduccionDeliveriesFilters,
  ListProduccionDeliveriesResult,
  ListProduccionOrdersFilters,
  ListProduccionOrdersResult,
  ListProduccionQuotationsFilters,
  ListProduccionQuotationsResult,
  ProduccionDeliveryDetail,
  ProduccionDeliveryRepository,
  ProduccionOrderDetail,
  ProduccionOrderRepository,
  ProduccionQuotationDetail,
  ProduccionQuotationLineDto,
  ProduccionQuotationRepository,
  UpdateProduccionDeliveryPayload,
  UpdateProduccionOrderPayload,
  UpdateProduccionQuotationPayload,
} from '@domain/repositories/produccion-sales.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

type LineInput = { furnitureId: string; quantity: number; unitPrice: number; notes?: string | null };

@Injectable()
export class ProduccionQuotationPrismaRepository implements ProduccionQuotationRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly orderRepo: ProduccionOrderRepository,
    @Inject(PRODUCCION_CONFIG_REPOSITORY)
    private readonly configRepo: ProduccionConfigRepository,
  ) {}

  private mapLine(row: {
    id: string;
    furnitureId: string;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    notes: string | null;
    furniture: { code: string; name: string };
  }): ProduccionQuotationLineDto {
    const quantity = num(row.quantity);
    const unitPrice = num(row.unitPrice);
    return {
      id: row.id,
      furnitureId: row.furnitureId,
      furnitureCode: row.furniture.code,
      furnitureName: row.furniture.name,
      quantity,
      unitPrice,
      lineTotal: roundMoney(quantity * unitPrice),
      notes: row.notes,
    };
  }

  private validateLines(lines: LineInput[]) {
    if (!lines.length) throw new BadRequestException('Debe incluir al menos una línea');
    for (const l of lines) {
      if (l.quantity <= 0) throw new BadRequestException('Cantidad debe ser positiva');
      if (l.unitPrice < 0) throw new BadRequestException('Precio unitario inválido');
    }
  }

  private async loadDetail(id: string): Promise<ProduccionQuotationDetail | null> {
    const row = await this.prisma.produccionQuotation.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } },
        lines: {
          include: { furniture: { select: { code: true, name: true } } },
          orderBy: { id: 'asc' },
        },
        order: { select: { id: true } },
      },
    });
    if (!row) return null;

    const lines = row.lines.map((l) => this.mapLine(l));
    const totalAmount = roundMoney(lines.reduce((s, l) => s + l.lineTotal, 0));

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionQuotationDetail['status'],
      clientId: row.clientId,
      clientName: row.client.fullName,
      validUntil: row.validUntil?.toISOString() ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      notes: row.notes,
      lines,
      totalAmount,
      orderId: row.order?.id ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionQuotationsFilters): Promise<ListProduccionQuotationsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionQuotationWhereInput[] = [{ applicationId: app.id }];
    if (filters.status) andParts.push({ status: filters.status });
    if (filters.clientId) andParts.push({ clientId: filters.clientId });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { client: { fullName: { contains: q, mode: 'insensitive' } } },
          { notes: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionQuotation.findMany({
        where,
        include: {
          client: { select: { fullName: true } },
          lines: { select: { quantity: true, unitPrice: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionQuotation.count({ where }),
    ]);

    return {
      data: rows.map((r) => {
        const totalAmount = roundMoney(
          r.lines.reduce((s, l) => s + num(l.quantity) * num(l.unitPrice), 0),
        );
        return {
          id: r.id,
          code: r.code,
          status: r.status as ProduccionQuotationDetail['status'],
          clientId: r.clientId,
          clientName: r.client.fullName,
          validUntil: r.validUntil?.toISOString() ?? null,
          sentAt: r.sentAt?.toISOString() ?? null,
          linesCount: r.lines.length,
          totalAmount,
          updatedAt: r.updatedAt.toISOString(),
        };
      }),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionQuotationDetail | null> {
    const row = await this.prisma.produccionQuotation.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  async create(applicationId: string, payload: CreateProduccionQuotationPayload) {
    this.validateLines(payload.lines);

    const client = await this.prisma.client.findFirst({
      where: { id: payload.clientId, applicationId },
    });
    if (!client) throw new BadRequestException('Cliente no encontrado');

    const furnitureIds = payload.lines.map((l) => l.furnitureId);
    const furniture = await this.prisma.produccionFurniture.findMany({
      where: { id: { in: furnitureIds }, applicationId },
    });
    if (furniture.length !== new Set(furnitureIds).size) {
      throw new BadRequestException('Uno o más muebles no son válidos');
    }

    await this.configRepo.ensureDefaults(applicationId);
    const code = await this.configRepo.allocateNextCode(
      applicationId,
      PRODUCCION_NUMBERING_SERIES_KEYS.QUOTATION,
    );
    const row = await this.prisma.produccionQuotation.create({
      data: {
        applicationId,
        clientId: payload.clientId,
        code,
        status: 'DRAFT',
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        notes: payload.notes?.trim() || null,
        lines: {
          create: payload.lines.map((l) => ({
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            notes: l.notes?.trim() || null,
          })),
        },
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear cotización');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionQuotationPayload) {
    const q = await this.prisma.produccionQuotation.findUnique({ where: { id } });
    if (!q) throw new BadRequestException('Cotización no encontrada');
    if (q.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden editar cotizaciones en borrador');
    }
    if (payload.lines) this.validateLines(payload.lines);

    if (payload.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: payload.clientId, applicationId: q.applicationId },
      });
      if (!client) throw new BadRequestException('Cliente no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      const patch: Prisma.ProduccionQuotationUncheckedUpdateInput = {};
      if (payload.clientId !== undefined) patch.clientId = payload.clientId;
      if (payload.validUntil !== undefined) {
        patch.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;
      }
      if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;
      await tx.produccionQuotation.update({ where: { id }, data: patch });

      if (payload.lines) {
        await tx.produccionQuotationLine.deleteMany({ where: { quotationId: id } });
        await tx.produccionQuotationLine.createMany({
          data: payload.lines.map((l) => ({
            quotationId: id,
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            notes: l.notes?.trim() || null,
          })),
        });
      }
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al actualizar cotización');
    return detail;
  }

  async send(id: string) {
    const q = await this.prisma.produccionQuotation.findUnique({ where: { id } });
    if (!q) throw new BadRequestException('Cotización no encontrada');
    if (q.status !== 'DRAFT') throw new BadRequestException('Solo borradores pueden enviarse');

    await this.prisma.produccionQuotation.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al enviar cotización');
    return detail;
  }

  async accept(id: string) {
    const q = await this.prisma.produccionQuotation.findUnique({ where: { id } });
    if (!q) throw new BadRequestException('Cotización no encontrada');
    if (q.status !== 'SENT') throw new BadRequestException('Solo cotizaciones enviadas pueden aceptarse');

    await this.prisma.produccionQuotation.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al aceptar cotización');
    return detail;
  }

  async reject(id: string) {
    const q = await this.prisma.produccionQuotation.findUnique({ where: { id } });
    if (!q) throw new BadRequestException('Cotización no encontrada');
    if (q.status !== 'SENT') throw new BadRequestException('Solo cotizaciones enviadas pueden rechazarse');

    await this.prisma.produccionQuotation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al rechazar cotización');
    return detail;
  }

  async convertToOrder(id: string): Promise<ProduccionOrderDetail> {
    const q = await this.prisma.produccionQuotation.findUnique({
      where: { id },
      include: {
        lines: true,
        order: true,
      },
    });
    if (!q) throw new BadRequestException('Cotización no encontrada');
    if (q.status !== 'ACCEPTED') {
      throw new BadRequestException('Solo cotizaciones aceptadas generan pedido');
    }
    if (q.order) throw new BadRequestException('Ya existe un pedido para esta cotización');

    return this.orderRepo.createFromQuotation({
      id: q.id,
      applicationId: q.applicationId,
      clientId: q.clientId,
      notes: q.notes,
      lines: q.lines.map((l) => ({
        furnitureId: l.furnitureId,
        quantity: num(l.quantity),
        unitPrice: num(l.unitPrice),
        notes: l.notes,
      })),
    });
  }

  async delete(id: string) {
    const q = await this.prisma.produccionQuotation.findUnique({ where: { id } });
    if (!q) return;
    if (q.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden eliminar borradores');
    }
    await this.prisma.produccionQuotation.delete({ where: { id } });
  }
}

@Injectable()
export class ProduccionOrderPrismaRepository implements ProduccionOrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCCION_CONFIG_REPOSITORY)
    private readonly configRepo: ProduccionConfigRepository,
  ) {}

  private mapOrderDetail(row: {
    id: string;
    code: string;
    status: string;
    clientId: string;
    quotationId: string | null;
    workOrderId: string | null;
    orderedAt: Date;
    notes: string | null;
    updatedAt: Date;
    client: { fullName: string };
    quotation: { code: string } | null;
    workOrder: { code: string } | null;
    lines: {
      id: string;
      furnitureId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      notes: string | null;
      furniture: { code: string; name: string };
    }[];
  }): ProduccionOrderDetail {
    const lines = row.lines.map((l) => {
      const quantity = num(l.quantity);
      const unitPrice = num(l.unitPrice);
      return {
        id: l.id,
        furnitureId: l.furnitureId,
        furnitureCode: l.furniture.code,
        furnitureName: l.furniture.name,
        quantity,
        unitPrice,
        lineTotal: roundMoney(quantity * unitPrice),
        notes: l.notes,
      };
    });
    const totalAmount = roundMoney(lines.reduce((s, l) => s + l.lineTotal, 0));

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionOrderDetail['status'],
      clientId: row.clientId,
      clientName: row.client.fullName,
      quotationId: row.quotationId,
      quotationCode: row.quotation?.code ?? null,
      workOrderId: row.workOrderId,
      workOrderCode: row.workOrder?.code ?? null,
      orderedAt: row.orderedAt.toISOString(),
      notes: row.notes,
      lines,
      totalAmount,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async loadDetail(id: string): Promise<ProduccionOrderDetail | null> {
    const row = await this.prisma.produccionOrder.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } },
        quotation: { select: { code: true } },
        workOrder: { select: { code: true } },
        lines: {
          include: { furniture: { select: { code: true, name: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!row) return null;
    return this.mapOrderDetail(row);
  }

  async createFromQuotation(q: {
    id: string;
    applicationId: string;
    clientId: string;
    notes: string | null;
    lines: {
      furnitureId: string;
      quantity: number;
      unitPrice: number;
      notes: string | null;
    }[];
  }) {
    await this.configRepo.ensureDefaults(q.applicationId);
    const code = await this.configRepo.allocateNextCode(
      q.applicationId,
      PRODUCCION_NUMBERING_SERIES_KEYS.ORDER,
    );
    const row = await this.prisma.produccionOrder.create({
      data: {
        applicationId: q.applicationId,
        clientId: q.clientId,
        quotationId: q.id,
        code,
        status: 'PENDING',
        orderedAt: new Date(),
        notes: q.notes,
        lines: {
          create: q.lines.map((l) => ({
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            notes: l.notes,
          })),
        },
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear pedido');
    return detail;
  }

  async list(filters: ListProduccionOrdersFilters): Promise<ListProduccionOrdersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionOrderWhereInput[] = [{ applicationId: app.id }];
    if (filters.status) andParts.push({ status: filters.status });
    if (filters.clientId) andParts.push({ clientId: filters.clientId });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { client: { fullName: { contains: q, mode: 'insensitive' } } },
          { quotation: { code: { contains: q, mode: 'insensitive' } } },
          { workOrder: { code: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionOrder.findMany({
        where,
        include: {
          client: { select: { fullName: true } },
          quotation: { select: { code: true } },
          workOrder: { select: { code: true } },
          lines: { select: { quantity: true, unitPrice: true } },
        },
        orderBy: { orderedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionOrder.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status as ProduccionOrderDetail['status'],
        clientId: r.clientId,
        clientName: r.client.fullName,
        quotationId: r.quotationId,
        quotationCode: r.quotation?.code ?? null,
        workOrderId: r.workOrderId,
        workOrderCode: r.workOrder?.code ?? null,
        orderedAt: r.orderedAt.toISOString(),
        linesCount: r.lines.length,
        totalAmount: roundMoney(
          r.lines.reduce((s, l) => s + num(l.quantity) * num(l.unitPrice), 0),
        ),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionOrderDetail | null> {
    const row = await this.prisma.produccionOrder.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  async create(applicationId: string, payload: CreateProduccionOrderPayload) {
    if (!payload.lines.length) throw new BadRequestException('Debe incluir al menos una línea');

    const client = await this.prisma.client.findFirst({
      where: { id: payload.clientId, applicationId },
    });
    if (!client) throw new BadRequestException('Cliente no encontrado');

    await this.configRepo.ensureDefaults(applicationId);
    const code = await this.configRepo.allocateNextCode(
      applicationId,
      PRODUCCION_NUMBERING_SERIES_KEYS.ORDER,
    );
    const row = await this.prisma.produccionOrder.create({
      data: {
        applicationId,
        clientId: payload.clientId,
        quotationId: payload.quotationId?.trim() || null,
        code,
        status: 'PENDING',
        orderedAt: payload.orderedAt ? new Date(payload.orderedAt) : new Date(),
        notes: payload.notes?.trim() || null,
        lines: {
          create: payload.lines.map((l) => ({
            furnitureId: l.furnitureId,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            notes: l.notes?.trim() || null,
          })),
        },
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear pedido');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionOrderPayload) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Pedido no editable en este estado');
    }

    await this.prisma.produccionOrder.update({
      where: { id },
      data: { notes: payload.notes?.trim() || null },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al actualizar pedido');
    return detail;
  }

  async confirm(id: string) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo pedidos pendientes pueden confirmarse');
    }

    await this.prisma.produccionOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al confirmar pedido');
    return detail;
  }

  async linkWorkOrder(id: string, workOrderId: string) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('El pedido no puede vincularse a producción en este estado');
    }
    if (order.workOrderId) throw new BadRequestException('El pedido ya tiene una OT');

    const wo = await this.prisma.produccionWorkOrder.findFirst({
      where: { id: workOrderId, applicationId: order.applicationId },
    });
    if (!wo) throw new BadRequestException('OT no encontrada');

    await this.prisma.produccionOrder.update({
      where: { id },
      data: { workOrderId, status: 'IN_PRODUCTION' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al vincular OT');
    return detail;
  }

  async markReady(id: string) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (order.status !== 'IN_PRODUCTION') {
      throw new BadRequestException('Solo pedidos en producción pueden marcarse listos');
    }

    await this.prisma.produccionOrder.update({
      where: { id },
      data: { status: 'READY' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al actualizar pedido');
    return detail;
  }

  async cancel(id: string) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Pedido no cancelable');
    }

    await this.prisma.produccionOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al cancelar pedido');
    return detail;
  }

  async delete(id: string) {
    const order = await this.prisma.produccionOrder.findUnique({ where: { id } });
    if (!order) return;
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo pedidos pendientes pueden eliminarse');
    }
    await this.prisma.produccionOrder.delete({ where: { id } });
  }
}

@Injectable()
export class ProduccionDeliveryPrismaRepository implements ProduccionDeliveryRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCCION_CONFIG_REPOSITORY)
    private readonly configRepo: ProduccionConfigRepository,
  ) {}

  private async loadDetail(id: string): Promise<ProduccionDeliveryDetail | null> {
    const row = await this.prisma.produccionDelivery.findUnique({
      where: { id },
      include: {
        order: {
          include: { client: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      status: row.status as ProduccionDeliveryDetail['status'],
      orderId: row.orderId,
      orderCode: row.order.code,
      clientId: row.order.client.id,
      clientName: row.order.client.fullName,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      address: row.address,
      recipientName: row.recipientName,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionDeliveriesFilters): Promise<ListProduccionDeliveriesResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionDeliveryWhereInput[] = [{ applicationId: app.id }];
    if (filters.status) andParts.push({ status: filters.status });
    if (filters.orderId) andParts.push({ orderId: filters.orderId });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { recipientName: { contains: q, mode: 'insensitive' } },
          { order: { code: { contains: q, mode: 'insensitive' } } },
          { order: { client: { fullName: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionDelivery.findMany({
        where,
        include: {
          order: {
            include: { client: { select: { fullName: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionDelivery.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status as ProduccionDeliveryDetail['status'],
        orderId: r.orderId,
        orderCode: r.order.code,
        clientName: r.order.client.fullName,
        scheduledAt: r.scheduledAt?.toISOString() ?? null,
        deliveredAt: r.deliveredAt?.toISOString() ?? null,
        recipientName: r.recipientName,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionDeliveryDetail | null> {
    const row = await this.prisma.produccionDelivery.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  async create(applicationId: string, payload: CreateProduccionDeliveryPayload) {
    const order = await this.prisma.produccionOrder.findFirst({
      where: { id: payload.orderId, applicationId },
    });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    if (!['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(order.status)) {
      throw new BadRequestException('El pedido no está listo para entrega');
    }

    await this.configRepo.ensureDefaults(applicationId);
    const code = await this.configRepo.allocateNextCode(
      applicationId,
      PRODUCCION_NUMBERING_SERIES_KEYS.DELIVERY,
    );
    const row = await this.prisma.produccionDelivery.create({
      data: {
        applicationId,
        orderId: payload.orderId,
        code,
        status: 'SCHEDULED',
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        address: payload.address?.trim() || null,
        recipientName: payload.recipientName?.trim() || null,
        notes: payload.notes?.trim() || null,
      },
    });

    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear entrega');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionDeliveryPayload) {
    const d = await this.prisma.produccionDelivery.findUnique({ where: { id } });
    if (!d) throw new BadRequestException('Entrega no encontrada');
    if (d.status !== 'SCHEDULED') {
      throw new BadRequestException('Solo entregas programadas pueden editarse');
    }

    await this.prisma.produccionDelivery.update({
      where: { id },
      data: {
        scheduledAt:
          payload.scheduledAt !== undefined
            ? payload.scheduledAt
              ? new Date(payload.scheduledAt)
              : null
            : undefined,
        address: payload.address !== undefined ? payload.address?.trim() || null : undefined,
        recipientName:
          payload.recipientName !== undefined ? payload.recipientName?.trim() || null : undefined,
        notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
      },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al actualizar entrega');
    return detail;
  }

  async complete(id: string) {
    const d = await this.prisma.produccionDelivery.findUnique({ where: { id } });
    if (!d) throw new BadRequestException('Entrega no encontrada');
    if (d.status !== 'SCHEDULED') {
      throw new BadRequestException('Solo entregas programadas pueden completarse');
    }

    await this.prisma.$transaction([
      this.prisma.produccionDelivery.update({
        where: { id },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      }),
      this.prisma.produccionOrder.update({
        where: { id: d.orderId },
        data: { status: 'DELIVERED' },
      }),
    ]);

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al completar entrega');
    return detail;
  }

  async cancel(id: string) {
    const d = await this.prisma.produccionDelivery.findUnique({ where: { id } });
    if (!d) throw new BadRequestException('Entrega no encontrada');
    if (d.status !== 'SCHEDULED') {
      throw new BadRequestException('Solo entregas programadas pueden cancelarse');
    }

    await this.prisma.produccionDelivery.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Error al cancelar entrega');
    return detail;
  }

  async delete(id: string) {
    const d = await this.prisma.produccionDelivery.findUnique({ where: { id } });
    if (!d) return;
    if (d.status !== 'SCHEDULED') {
      throw new BadRequestException('Solo entregas programadas pueden eliminarse');
    }
    await this.prisma.produccionDelivery.delete({ where: { id } });
  }
}
