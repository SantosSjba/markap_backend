export const CONTABILIDAD_CONFIG_REPOSITORY = Symbol('ContabilidadConfigRepository');

export interface ContabilidadCompanyProfileDto {
  ruc: string;
  legalName: string;
  tradeName: string | null;
  fiscalAddress: string;
  district: string;
  province: string;
  department: string;
  ubigeoCode: string;
}

export interface ContabilidadAppSettingsDto {
  taxRegime: string;
  isDetractionAgent: boolean;
  isRetentionAgent: boolean;
  isPerceptionAgent: boolean;
  igvPercent: number;
  currencyCode: string;
  fiscalYearStartMonth: number;
  amountDecimals: number;
}

export interface ContabilidadDocumentSeriesDto {
  seriesKey: string;
  sunatSeries: string;
  lastNumber: number;
  padLength: number;
  isActive: boolean;
  nextPreview: string;
}

export interface ContabilidadConfigRepository {
  ensureDefaults(applicationId: string): Promise<void>;
  getCompanyProfile(applicationId: string): Promise<ContabilidadCompanyProfileDto>;
  updateCompanyProfile(
    applicationId: string,
    data: Partial<ContabilidadCompanyProfileDto>,
  ): Promise<ContabilidadCompanyProfileDto>;
  getSettings(applicationId: string): Promise<ContabilidadAppSettingsDto>;
  updateSettings(
    applicationId: string,
    data: Partial<ContabilidadAppSettingsDto>,
  ): Promise<ContabilidadAppSettingsDto>;
  listDocumentSeries(applicationId: string): Promise<ContabilidadDocumentSeriesDto[]>;
  updateDocumentSeries(
    applicationId: string,
    seriesKey: string,
    data: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean },
  ): Promise<ContabilidadDocumentSeriesDto>;
  previewNextDocumentNumber(applicationId: string, seriesKey: string): Promise<string>;
}
