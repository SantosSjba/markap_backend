import type {
  ProduccionFurnitureCategoryDto,
  ProduccionNumberingSeriesDto,
  ProduccionProductionStageDto,
  ProduccionUnitDto,
} from '@domain/repositories/produccion-config.repository';

function formatCode(row: {
  prefix: string;
  lastNumber: number;
  padLength: number;
  includeYear: boolean;
}): string {
  const n = String(row.lastNumber).padStart(row.padLength, '0');
  if (row.includeYear) {
    const year = new Date().getFullYear();
    return `${row.prefix}-${year}-${n}`;
  }
  return `${row.prefix}-${n}`;
}

export const ProduccionConfigPrismaMapper = {
  toCategory(row: {
    id: string;
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): ProduccionFurnitureCategoryDto {
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    };
  },

  toStage(row: {
    id: string;
    stageKey: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): ProduccionProductionStageDto {
    return {
      id: row.id,
      stageKey: row.stageKey,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    };
  },

  toUnit(row: {
    id: string;
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): ProduccionUnitDto {
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    };
  },

  toNumbering(row: {
    seriesKey: string;
    prefix: string;
    lastNumber: number;
    padLength: number;
    includeYear: boolean;
  }): ProduccionNumberingSeriesDto {
    const nextPreview = formatCode({ ...row, lastNumber: row.lastNumber + 1 });
    return {
      seriesKey: row.seriesKey,
      prefix: row.prefix,
      lastNumber: row.lastNumber,
      padLength: row.padLength,
      includeYear: row.includeYear,
      nextPreview,
    };
  },
};

export { formatCode as formatProduccionNumberingCode };
