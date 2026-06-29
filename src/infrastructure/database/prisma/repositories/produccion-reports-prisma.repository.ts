import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  ProduccionReportsDashboardDto,
  ProduccionReportsFilters,
  ProduccionReportsRepository,
} from '@domain/repositories/produccion-reports.repository';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function defaultRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 89);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function dayStartUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function dayEndUtc(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

function isLowStock(stock: number, min: number): boolean {
  return min > 0 && stock <= min;
}

function estimateFurnitureCost(row: {
  bomLines: { quantity: Prisma.Decimal; unitCost: Prisma.Decimal | null }[];
  laborEntries: { hours: Prisma.Decimal; hourlyRate: Prisma.Decimal }[];
  extraExpenses: { amount: Prisma.Decimal }[];
}): number {
  const materials = row.bomLines.reduce(
    (s, l) => s + num(l.quantity) * num(l.unitCost),
    0,
  );
  const labor = row.laborEntries.reduce(
    (s, l) => s + num(l.hours) * num(l.hourlyRate),
    0,
  );
  const extras = row.extraExpenses.reduce((s, l) => s + num(l.amount), 0);
  return round2(materials + labor + extras);
}

@Injectable()
export class ProduccionReportsPrismaRepository implements ProduccionReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(filters: ProduccionReportsFilters): Promise<ProduccionReportsDashboardDto | null> {
    const slug = filters.applicationSlug.trim() || 'produccion';
    const app = await this.prisma.application.findUnique({ where: { slug } });
    if (!app) return null;

    const fallback = defaultRange();
    const startStr = filters.startDate?.trim() || fallback.startDate;
    const endStr = filters.endDate?.trim() || fallback.endDate;
    const range = { startDate: startStr, endDate: endStr };
    const start = dayStartUtc(startStr);
    const end = dayEndUtc(endStr);
    const clientId = filters.clientId?.trim() || undefined;
    const category = filters.category?.trim() || undefined;

    const woBase: Prisma.ProduccionWorkOrderWhereInput = {
      applicationId: app.id,
      ...(clientId ? { clientId } : {}),
    };

    const orderBase: Prisma.ProduccionOrderWhereInput = {
      applicationId: app.id,
      ...(clientId ? { clientId } : {}),
    };

    const quotationBase: Prisma.ProduccionQuotationWhereInput = {
      applicationId: app.id,
      ...(clientId ? { clientId } : {}),
    };

    const materialWhere: Prisma.ProduccionMaterialWhereInput = {
      applicationId: app.id,
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    };

    const furnitureWhere: Prisma.ProduccionFurnitureWhereInput = {
      applicationId: app.id,
      isActive: true,
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    };

    const [
      woCreated,
      woCompleted,
      woInProgress,
      woStatusGroups,
      consumptionsAgg,
      quotationsSent,
      quotationsAccepted,
      ordersCreated,
      ordersDelivered,
      deliveredOrders,
      pipelineOrders,
      materials,
      movementsInPeriod,
      stockInMovements,
      furnitureRows,
      soldLines,
      openQuotations,
      pendingOrders,
      activeWorkOrders,
      pendingPurchaseOrders,
    ] = await Promise.all([
      this.prisma.produccionWorkOrder.count({
        where: { ...woBase, createdAt: { gte: start, lte: end } },
      }),
      this.prisma.produccionWorkOrder.count({
        where: { ...woBase, status: 'COMPLETED', completedAt: { gte: start, lte: end } },
      }),
      this.prisma.produccionWorkOrder.count({
        where: { ...woBase, status: 'IN_PROGRESS' },
      }),
      this.prisma.produccionWorkOrder.groupBy({
        by: ['status'],
        where: woBase,
        _count: { _all: true },
      }),
      this.prisma.produccionWorkOrderMaterialConsumption.aggregate({
        where: {
          consumedAt: { gte: start, lte: end },
          workOrder: woBase,
        },
        _sum: { quantity: true },
      }),
      this.prisma.produccionQuotation.count({
        where: {
          ...quotationBase,
          sentAt: { gte: start, lte: end },
        },
      }),
      this.prisma.produccionQuotation.count({
        where: {
          ...quotationBase,
          status: 'ACCEPTED',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.produccionOrder.count({
        where: { ...orderBase, orderedAt: { gte: start, lte: end } },
      }),
      this.prisma.produccionOrder.count({
        where: {
          ...orderBase,
          status: 'DELIVERED',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.produccionOrder.findMany({
        where: {
          ...orderBase,
          status: 'DELIVERED',
          updatedAt: { gte: start, lte: end },
        },
        include: { lines: true },
      }),
      this.prisma.produccionOrder.findMany({
        where: {
          ...orderBase,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY'] },
        },
        include: { lines: true },
      }),
      this.prisma.produccionMaterial.findMany({ where: materialWhere }),
      this.prisma.produccionStockMovement.count({
        where: {
          createdAt: { gte: start, lte: end },
          material: materialWhere,
        },
      }),
      this.prisma.produccionStockMovement.findMany({
        where: {
          movementType: 'IN',
          createdAt: { gte: start, lte: end },
          material: materialWhere,
        },
        select: { quantity: true, unitCost: true },
      }),
      this.prisma.produccionFurniture.findMany({
        where: furnitureWhere,
        include: {
          bomLines: { select: { quantity: true, unitCost: true } },
          laborEntries: { select: { hours: true, hourlyRate: true } },
          extraExpenses: { select: { amount: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.produccionOrderLine.findMany({
        where: {
          order: {
            ...orderBase,
            status: 'DELIVERED',
            updatedAt: { gte: start, lte: end },
          },
          ...(category
            ? { furniture: { category: { equals: category, mode: 'insensitive' } } }
            : {}),
        },
        select: {
          furnitureId: true,
          quantity: true,
          unitPrice: true,
        },
      }),
      this.prisma.produccionQuotation.count({
        where: { ...quotationBase, status: { in: ['DRAFT', 'SENT'] } },
      }),
      this.prisma.produccionOrder.count({
        where: { ...orderBase, status: 'PENDING' },
      }),
      this.prisma.produccionWorkOrder.count({
        where: { ...woBase, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      this.prisma.produccionPurchaseOrder.count({
        where: {
          applicationId: app.id,
          status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
        },
      }),
    ]);

    let lowStockCount = 0;
    let totalStockValue = 0;
    let activeMaterials = 0;
    const categoryMap = new Map<string, { itemCount: number; totalValue: number }>();

    for (const m of materials) {
      if (m.isActive) activeMaterials += 1;
      const stock = num(m.currentStock);
      const min = num(m.minStockQty);
      const value = round2(stock * num(m.unitCost));
      if (isLowStock(stock, min)) lowStockCount += 1;
      totalStockValue += value;

      const cat = m.category.trim() || 'Sin categoría';
      const prev = categoryMap.get(cat) ?? { itemCount: 0, totalValue: 0 };
      categoryMap.set(cat, {
        itemCount: prev.itemCount + 1,
        totalValue: round2(prev.totalValue + value),
      });
    }

    const stockInValuePeriod = round2(
      stockInMovements.reduce((s, m) => s + num(m.quantity) * num(m.unitCost), 0),
    );

    const salesRevenuePeriod = round2(
      deliveredOrders.reduce(
        (s, o) => s + o.lines.reduce((ls, l) => ls + num(l.quantity) * num(l.unitPrice), 0),
        0,
      ),
    );

    const pipelineValue = round2(
      pipelineOrders.reduce(
        (s, o) => s + o.lines.reduce((ls, l) => ls + num(l.quantity) * num(l.unitPrice), 0),
        0,
      ),
    );

    const soldByFurniture = new Map<string, { units: number; revenue: number }>();
    for (const line of soldLines) {
      const prev = soldByFurniture.get(line.furnitureId) ?? { units: 0, revenue: 0 };
      const qty = num(line.quantity);
      const rev = qty * num(line.unitPrice);
      soldByFurniture.set(line.furnitureId, {
        units: prev.units + qty,
        revenue: round2(prev.revenue + rev),
      });
    }

    const rentabilidadRows = furnitureRows.map((f) => {
      const referencePrice = num(f.referencePrice);
      const estimatedCost = estimateFurnitureCost(f);
      const marginAmount = round2(referencePrice - estimatedCost);
      const marginPercent =
        referencePrice > 0 ? round2((marginAmount / referencePrice) * 100) : null;
      const sold = soldByFurniture.get(f.id) ?? { units: 0, revenue: 0 };
      return {
        furnitureId: f.id,
        furnitureCode: f.code,
        furnitureName: f.name,
        category: f.category,
        referencePrice,
        estimatedCost,
        marginAmount,
        marginPercent,
        unitsSoldPeriod: sold.units,
        revenuePeriod: sold.revenue,
      };
    });

    const marginsWithValue = rentabilidadRows
      .map((r) => r.marginPercent)
      .filter((m): m is number => m !== null);
    const avgMarginPercent =
      marginsWithValue.length > 0
        ? round2(marginsWithValue.reduce((s, m) => s + m, 0) / marginsWithValue.length)
        : null;

    return {
      applicationSlug: slug,
      range,
      filters: { clientId: clientId ?? null, category: category ?? null },
      produccion: {
        workOrdersCreated: woCreated,
        workOrdersCompleted: woCompleted,
        workOrdersInProgressSnapshot: woInProgress,
        workOrdersByStatus: woStatusGroups.map((g) => ({
          status: g.status,
          count: g._count._all,
        })),
        materialConsumptionQty: num(consumptionsAgg._sum.quantity),
      },
      ventas: {
        quotationsSent,
        quotationsAccepted,
        ordersCreated,
        ordersDelivered,
        salesRevenuePeriod,
        pipelineValue,
      },
      inventario: {
        totalMaterials: materials.length,
        activeMaterials,
        lowStockCount,
        totalStockValue: round2(totalStockValue),
        stockValueByCategory: [...categoryMap.entries()]
          .map(([cat, v]) => ({
            category: cat,
            itemCount: v.itemCount,
            totalValue: v.totalValue,
          }))
          .sort((a, b) => b.totalValue - a.totalValue),
        movementsInPeriod,
        stockInValuePeriod,
      },
      rentabilidad: {
        rows: rentabilidadRows,
        avgMarginPercent,
      },
      kpis: {
        openQuotations,
        pendingOrders,
        activeWorkOrders,
        pendingPurchaseOrders,
      },
    };
  }
}
