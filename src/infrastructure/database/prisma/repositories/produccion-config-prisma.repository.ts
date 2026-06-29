import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ProduccionConfigPrismaMapper, formatProduccionNumberingCode } from '../mappers/produccion-config-prisma.mapper';
import {
  PRODUCCION_DEFAULT_FURNITURE_CATEGORIES,
  PRODUCCION_DEFAULT_MATERIAL_CATEGORIES,
  PRODUCCION_DEFAULT_NUMBERING,
  PRODUCCION_DEFAULT_PRODUCTION_STAGES,
  PRODUCCION_DEFAULT_UNITS,
  PRODUCCION_NUMBERING_SERIES_KEYS,
} from '@domain/constants/produccion-config.defaults';
import type {
  ProduccionAppSettingsDto,
  ProduccionConfigRepository,
  ProduccionFurnitureCategoryInput,
  ProduccionMaterialCategoryInput,
  ProduccionProductionStageInput,
  ProduccionUnitInput,
} from '@domain/repositories/produccion-config.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class ProduccionConfigPrismaRepository implements ProduccionConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults(applicationId: string): Promise<void> {
    const settingsCount = await this.prisma.produccionAppSettings.count({ where: { applicationId } });
    if (settingsCount === 0) {
      await this.prisma.produccionAppSettings.create({
        data: { applicationId },
      });
    }

    const catCount = await this.prisma.produccionFurnitureCategoryConfig.count({ where: { applicationId } });
    if (catCount === 0) {
      await this.prisma.produccionFurnitureCategoryConfig.createMany({
        data: PRODUCCION_DEFAULT_FURNITURE_CATEGORIES.map((c) => ({
          applicationId,
          code: c.code,
          label: c.label,
          sortOrder: c.sortOrder,
          isActive: true,
        })),
      });
    }

    const matCatCount = await this.prisma.produccionMaterialCategoryConfig.count({ where: { applicationId } });
    if (matCatCount === 0) {
      await this.prisma.produccionMaterialCategoryConfig.createMany({
        data: PRODUCCION_DEFAULT_MATERIAL_CATEGORIES.map((c) => ({
          applicationId,
          code: c.code,
          label: c.label,
          sortOrder: c.sortOrder,
          isActive: true,
        })),
      });
    }

    const stageCount = await this.prisma.produccionProductionStageConfig.count({ where: { applicationId } });
    if (stageCount === 0) {
      await this.prisma.produccionProductionStageConfig.createMany({
        data: PRODUCCION_DEFAULT_PRODUCTION_STAGES.map((s) => ({
          applicationId,
          stageKey: s.stageKey,
          label: s.label,
          sortOrder: s.sortOrder,
          isActive: true,
        })),
      });
    }

    const unitCount = await this.prisma.produccionUnitConfig.count({ where: { applicationId } });
    if (unitCount === 0) {
      await this.prisma.produccionUnitConfig.createMany({
        data: PRODUCCION_DEFAULT_UNITS.map((u) => ({
          applicationId,
          code: u.code,
          label: u.label,
          sortOrder: u.sortOrder,
          isActive: true,
        })),
      });
    }

    for (const def of PRODUCCION_DEFAULT_NUMBERING) {
      const exists = await this.prisma.produccionNumberingSeries.count({
        where: { applicationId, seriesKey: def.seriesKey },
      });
      if (exists > 0) continue;

      const lastNumber = await this.estimateLastNumber(applicationId, def.seriesKey);
      await this.prisma.produccionNumberingSeries.create({
        data: {
          applicationId,
          seriesKey: def.seriesKey,
          prefix: def.prefix,
          lastNumber,
          includeYear: def.includeYear,
          padLength: 4,
        },
      });
    }
  }

  private async estimateLastNumber(applicationId: string, seriesKey: string): Promise<number> {
    switch (seriesKey) {
      case PRODUCCION_NUMBERING_SERIES_KEYS.FURNITURE:
        return this.prisma.produccionFurniture.count({ where: { applicationId } });
      case PRODUCCION_NUMBERING_SERIES_KEYS.WORK_ORDER:
        return this.prisma.produccionWorkOrder.count({ where: { applicationId } });
      case PRODUCCION_NUMBERING_SERIES_KEYS.QUOTATION:
        return this.prisma.produccionQuotation.count({ where: { applicationId } });
      case PRODUCCION_NUMBERING_SERIES_KEYS.PURCHASE_ORDER:
        return this.prisma.produccionPurchaseOrder.count({ where: { applicationId } });
      case PRODUCCION_NUMBERING_SERIES_KEYS.ORDER:
        return this.prisma.produccionOrder.count({ where: { applicationId } });
      case PRODUCCION_NUMBERING_SERIES_KEYS.DELIVERY:
        return this.prisma.produccionDelivery.count({ where: { applicationId } });
      default:
        return 0;
    }
  }

  async getSettings(applicationId: string): Promise<ProduccionAppSettingsDto> {
    const row = await this.prisma.produccionAppSettings.findUnique({ where: { applicationId } });
    if (!row) {
      return { igvPercent: 18, woodWastePercent: 10, quotationValidDays: 30 };
    }
    return {
      igvPercent: num(row.igvPercent),
      woodWastePercent: num(row.woodWastePercent),
      quotationValidDays: row.quotationValidDays,
    };
  }

  async updateSettings(
    applicationId: string,
    data: Partial<ProduccionAppSettingsDto>,
  ): Promise<ProduccionAppSettingsDto> {
    const row = await this.prisma.produccionAppSettings.upsert({
      where: { applicationId },
      create: {
        applicationId,
        igvPercent: new Prisma.Decimal(data.igvPercent ?? 18),
        woodWastePercent: new Prisma.Decimal(data.woodWastePercent ?? 10),
        quotationValidDays: data.quotationValidDays ?? 30,
      },
      update: {
        ...(data.igvPercent !== undefined && { igvPercent: new Prisma.Decimal(data.igvPercent) }),
        ...(data.woodWastePercent !== undefined && {
          woodWastePercent: new Prisma.Decimal(data.woodWastePercent),
        }),
        ...(data.quotationValidDays !== undefined && { quotationValidDays: data.quotationValidDays }),
      },
    });
    return {
      igvPercent: num(row.igvPercent),
      woodWastePercent: num(row.woodWastePercent),
      quotationValidDays: row.quotationValidDays,
    };
  }

  async listFurnitureCategories(applicationId: string) {
    const rows = await this.prisma.produccionFurnitureCategoryConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ProduccionConfigPrismaMapper.toCategory(r));
  }

  async replaceFurnitureCategories(applicationId: string, rows: ProduccionFurnitureCategoryInput[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.produccionFurnitureCategoryConfig.deleteMany({ where: { applicationId } });
      if (rows.length) {
        await tx.produccionFurnitureCategoryConfig.createMany({
          data: rows.map((r, i) => ({
            applicationId,
            code: r.code.trim(),
            label: r.label.trim(),
            sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : i,
            isActive: r.isActive !== false,
          })),
        });
      }
    });
  }

  async listMaterialCategories(applicationId: string) {
    const rows = await this.prisma.produccionMaterialCategoryConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ProduccionConfigPrismaMapper.toMaterialCategory(r));
  }

  async replaceMaterialCategories(applicationId: string, rows: ProduccionMaterialCategoryInput[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.produccionMaterialCategoryConfig.deleteMany({ where: { applicationId } });
      if (rows.length) {
        await tx.produccionMaterialCategoryConfig.createMany({
          data: rows.map((r, i) => ({
            applicationId,
            code: r.code.trim(),
            label: r.label.trim(),
            sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : i,
            isActive: r.isActive !== false,
          })),
        });
      }
    });
  }

  async listProductionStages(applicationId: string) {
    const rows = await this.prisma.produccionProductionStageConfig.findMany({
      where: { applicationId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ProduccionConfigPrismaMapper.toStage(r));
  }

  async replaceProductionStages(applicationId: string, rows: ProduccionProductionStageInput[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.produccionProductionStageConfig.deleteMany({ where: { applicationId } });
      await tx.produccionProductionStageConfig.createMany({
        data: rows.map((r, i) => ({
          applicationId,
          stageKey: r.stageKey.trim(),
          label: r.label.trim(),
          sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : i,
          isActive: r.isActive !== false,
        })),
      });
    });
  }

  async listUnits(applicationId: string) {
    const rows = await this.prisma.produccionUnitConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ProduccionConfigPrismaMapper.toUnit(r));
  }

  async replaceUnits(applicationId: string, rows: ProduccionUnitInput[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.produccionUnitConfig.deleteMany({ where: { applicationId } });
      if (rows.length) {
        await tx.produccionUnitConfig.createMany({
          data: rows.map((r, i) => ({
            applicationId,
            code: r.code.trim(),
            label: r.label.trim(),
            sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : i,
            isActive: r.isActive !== false,
          })),
        });
      }
    });
  }

  async listNumberingSeries(applicationId: string) {
    const rows = await this.prisma.produccionNumberingSeries.findMany({
      where: { applicationId },
      orderBy: { seriesKey: 'asc' },
    });
    return rows.map((r) => ProduccionConfigPrismaMapper.toNumbering(r));
  }

  async updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean },
  ) {
    const row = await this.prisma.produccionNumberingSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix.trim() }),
        ...(data.lastNumber !== undefined && { lastNumber: data.lastNumber }),
        ...(data.padLength !== undefined && { padLength: data.padLength }),
        ...(data.includeYear !== undefined && { includeYear: data.includeYear }),
      },
    });
    return ProduccionConfigPrismaMapper.toNumbering(row);
  }

  async previewNextCode(applicationId: string, seriesKey: string): Promise<string> {
    await this.ensureDefaults(applicationId);
    const row = await this.prisma.produccionNumberingSeries.findUnique({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    if (!row) return '';
    return formatProduccionNumberingCode({ ...row, lastNumber: row.lastNumber + 1 });
  }

  async allocateNextCode(applicationId: string, seriesKey: string): Promise<string> {
    await this.ensureDefaults(applicationId);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.produccionNumberingSeries.update({
        where: { applicationId_seriesKey: { applicationId, seriesKey } },
        data: { lastNumber: { increment: 1 } },
      });
      return updated;
    });
    return formatProduccionNumberingCode(row);
  }
}
