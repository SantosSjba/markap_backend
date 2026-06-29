import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CostingSnapshotDto,
  CostingTotalsDto,
  CreateCostingSnapshotPayload,
  FurnitureCostingDetail,
  ProduccionFurnitureCostingRepository,
  UpdateFurnitureCostingPayload,
} from '@domain/repositories/produccion-furniture-costing.repository';

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeTotals(
  materialsTotal: number,
  laborTotal: number,
  extrasTotal: number,
  referencePrice: number,
): CostingTotalsDto {
  const totalCost = round2(materialsTotal + laborTotal + extrasTotal);
  const marginAmount = round2(referencePrice - totalCost);
  const marginPercent =
    referencePrice > 0 ? round2((marginAmount / referencePrice) * 100) : null;

  return {
    materials: round2(materialsTotal),
    labor: round2(laborTotal),
    extras: round2(extrasTotal),
    totalCost,
    referencePrice: round2(referencePrice),
    marginAmount,
    marginPercent,
  };
}

@Injectable()
export class ProduccionFurnitureCostingPrismaRepository implements ProduccionFurnitureCostingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async loadFurniture(furnitureId: string, applicationSlug: string) {
    return this.prisma.produccionFurniture.findFirst({
      where: {
        id: furnitureId,
        application: { slug: applicationSlug.trim() },
      },
      include: {
        bomLines: { orderBy: { sortOrder: 'asc' } },
        laborEntries: { orderBy: { sortOrder: 'asc' } },
        extraExpenses: { orderBy: { sortOrder: 'asc' } },
        costSnapshots: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  private buildDetail(row: NonNullable<Awaited<ReturnType<typeof this.loadFurniture>>>): FurnitureCostingDetail {
    const referencePrice = num(row.referencePrice) ?? 0;

    const materials = row.bomLines.map((bl) => {
      const qty = num(bl.quantity) ?? 0;
      const unitCost = num(bl.unitCost);
      const lineTotal = round2(qty * (unitCost ?? 0));
      return {
        id: bl.id,
        materialName: bl.materialName,
        unit: bl.unit,
        quantity: qty,
        unitCost,
        lineTotal,
      };
    });

    const laborEntries = row.laborEntries.map((le) => {
      const hours = num(le.hours) ?? 0;
      const hourlyRate = num(le.hourlyRate) ?? 0;
      return {
        id: le.id,
        laborRateId: le.laborRateId,
        description: le.description,
        hours,
        hourlyRate,
        lineTotal: round2(hours * hourlyRate),
      };
    });

    const extraExpenses = row.extraExpenses.map((ex) => ({
      id: ex.id,
      catalogItemId: ex.catalogItemId,
      description: ex.description,
      amount: num(ex.amount) ?? 0,
    }));

    const materialsTotal = materials.reduce((s, m) => s + m.lineTotal, 0);
    const laborTotal = laborEntries.reduce((s, l) => s + l.lineTotal, 0);
    const extrasTotal = extraExpenses.reduce((s, e) => s + e.amount, 0);

    const recentSnapshots: CostingSnapshotDto[] = row.costSnapshots.map((sn) => ({
      id: sn.id,
      label: sn.label,
      materialsTotal: num(sn.materialsTotal) ?? 0,
      laborTotal: num(sn.laborTotal) ?? 0,
      extrasTotal: num(sn.extrasTotal) ?? 0,
      totalCost: num(sn.totalCost) ?? 0,
      referencePrice: num(sn.referencePrice) ?? 0,
      marginPercent: num(sn.marginPercent),
      createdAt: sn.createdAt.toISOString(),
    }));

    return {
      furnitureId: row.id,
      furnitureCode: row.code,
      furnitureName: row.name,
      referencePrice,
      materials,
      laborEntries,
      extraExpenses,
      totals: computeTotals(materialsTotal, laborTotal, extrasTotal, referencePrice),
      recentSnapshots,
    };
  }

  async getCosting(furnitureId: string, applicationSlug: string): Promise<FurnitureCostingDetail | null> {
    const row = await this.loadFurniture(furnitureId, applicationSlug);
    if (!row) return null;
    return this.buildDetail(row);
  }

  async updateCosting(
    furnitureId: string,
    applicationSlug: string,
    payload: UpdateFurnitureCostingPayload,
  ): Promise<FurnitureCostingDetail> {
    const exists = await this.loadFurniture(furnitureId, applicationSlug);
    if (!exists) throw new Error('Furniture not found for costing');

    await this.prisma.$transaction(async (tx) => {
      if (payload.bomUnitCosts?.length) {
        for (const item of payload.bomUnitCosts) {
          await tx.produccionFurnitureBomLine.updateMany({
            where: { id: item.id, furnitureId },
            data: {
              unitCost:
                item.unitCost != null ? new Prisma.Decimal(item.unitCost) : null,
            },
          });
        }
      }

      if (payload.laborEntries !== undefined) {
        await tx.produccionFurnitureLaborEntry.deleteMany({ where: { furnitureId } });
        const entries = payload.laborEntries.filter((e) => e.description.trim());
        if (entries.length > 0) {
          await tx.produccionFurnitureLaborEntry.createMany({
            data: await Promise.all(
              entries.map(async (e, i) => {
                let hourlyRate = e.hourlyRate;
                if (hourlyRate == null && e.laborRateId) {
                  const rate = await tx.produccionLaborRate.findUnique({
                    where: { id: e.laborRateId },
                  });
                  hourlyRate = num(rate?.hourlyRate) ?? 0;
                }
                return {
                  furnitureId,
                  laborRateId: e.laborRateId ?? null,
                  description: e.description.trim(),
                  hours: new Prisma.Decimal(e.hours),
                  hourlyRate: new Prisma.Decimal(hourlyRate ?? 0),
                  sortOrder: i,
                };
              }),
            ),
          });
        }
      }

      if (payload.extraExpenses !== undefined) {
        await tx.produccionFurnitureExtraExpense.deleteMany({ where: { furnitureId } });
        const expenses = payload.extraExpenses.filter((e) => e.description.trim());
        if (expenses.length > 0) {
          await tx.produccionFurnitureExtraExpense.createMany({
            data: expenses.map((e, i) => ({
              furnitureId,
              catalogItemId: e.catalogItemId ?? null,
              description: e.description.trim(),
              amount: new Prisma.Decimal(e.amount),
              sortOrder: i,
            })),
          });
        }
      }
    });

    const detail = await this.getCosting(furnitureId, applicationSlug);
    if (!detail) throw new Error('Costing update: not found');
    return detail;
  }

  async createSnapshot(
    furnitureId: string,
    applicationSlug: string,
    payload: CreateCostingSnapshotPayload,
  ): Promise<CostingSnapshotDto> {
    const detail = await this.getCosting(furnitureId, applicationSlug);
    if (!detail) throw new Error('Furniture not found for snapshot');

    const row = await this.prisma.produccionFurnitureCostSnapshot.create({
      data: {
        furnitureId,
        label: payload.label?.trim() || null,
        materialsTotal: new Prisma.Decimal(detail.totals.materials),
        laborTotal: new Prisma.Decimal(detail.totals.labor),
        extrasTotal: new Prisma.Decimal(detail.totals.extras),
        totalCost: new Prisma.Decimal(detail.totals.totalCost),
        referencePrice: new Prisma.Decimal(detail.totals.referencePrice),
        marginPercent:
          detail.totals.marginPercent != null
            ? new Prisma.Decimal(detail.totals.marginPercent)
            : null,
      },
    });

    return {
      id: row.id,
      label: row.label,
      materialsTotal: detail.totals.materials,
      laborTotal: detail.totals.labor,
      extrasTotal: detail.totals.extras,
      totalCost: detail.totals.totalCost,
      referencePrice: detail.totals.referencePrice,
      marginPercent: detail.totals.marginPercent,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listSnapshots(furnitureId: string, applicationSlug: string): Promise<CostingSnapshotDto[]> {
    const furniture = await this.prisma.produccionFurniture.findFirst({
      where: { id: furnitureId, application: { slug: applicationSlug.trim() } },
      select: { id: true },
    });
    if (!furniture) return [];

    const rows = await this.prisma.produccionFurnitureCostSnapshot.findMany({
      where: { furnitureId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return rows.map((sn) => ({
      id: sn.id,
      label: sn.label,
      materialsTotal: num(sn.materialsTotal) ?? 0,
      laborTotal: num(sn.laborTotal) ?? 0,
      extrasTotal: num(sn.extrasTotal) ?? 0,
      totalCost: num(sn.totalCost) ?? 0,
      referencePrice: num(sn.referencePrice) ?? 0,
      marginPercent: num(sn.marginPercent),
      createdAt: sn.createdAt.toISOString(),
    }));
  }
}
