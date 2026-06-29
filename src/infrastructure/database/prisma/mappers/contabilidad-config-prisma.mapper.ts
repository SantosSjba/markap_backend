import type { ContabilidadDocumentSeriesDto } from '@domain/repositories/contabilidad-config.repository';

export function formatContabilidadDocumentNumber(row: {
  sunatSeries: string;
  lastNumber: number;
  padLength: number;
}): string {
  const n = String(row.lastNumber).padStart(row.padLength, '0');
  return `${row.sunatSeries}-${n}`;
}

export const ContabilidadConfigPrismaMapper = {
  toCompanyProfile(row: {
    ruc: string;
    legalName: string;
    tradeName: string | null;
    fiscalAddress: string;
    district: string;
    province: string;
    department: string;
    ubigeoCode: string;
  }) {
    return {
      ruc: row.ruc,
      legalName: row.legalName,
      tradeName: row.tradeName,
      fiscalAddress: row.fiscalAddress,
      district: row.district,
      province: row.province,
      department: row.department,
      ubigeoCode: row.ubigeoCode,
    };
  },

  toSettings(row: {
    taxRegime: string;
    isDetractionAgent: boolean;
    isRetentionAgent: boolean;
    isPerceptionAgent: boolean;
    igvPercent: unknown;
    currencyCode: string;
    fiscalYearStartMonth: number;
    amountDecimals: number;
  }) {
    return {
      taxRegime: row.taxRegime,
      isDetractionAgent: row.isDetractionAgent,
      isRetentionAgent: row.isRetentionAgent,
      isPerceptionAgent: row.isPerceptionAgent,
      igvPercent: Number(row.igvPercent),
      currencyCode: row.currencyCode,
      fiscalYearStartMonth: row.fiscalYearStartMonth,
      amountDecimals: row.amountDecimals,
    };
  },

  toDocumentSeries(row: {
    seriesKey: string;
    sunatSeries: string;
    lastNumber: number;
    padLength: number;
    isActive: boolean;
  }): ContabilidadDocumentSeriesDto {
    const nextPreview = formatContabilidadDocumentNumber({ ...row, lastNumber: row.lastNumber + 1 });
    return {
      seriesKey: row.seriesKey,
      sunatSeries: row.sunatSeries,
      lastNumber: row.lastNumber,
      padLength: row.padLength,
      isActive: row.isActive,
      nextPreview,
    };
  },
};
