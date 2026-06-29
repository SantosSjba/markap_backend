export const PRODUCCION_CONFIG_REPOSITORY = Symbol('ProduccionConfigRepository');

export interface ProduccionAppSettingsDto {
  igvPercent: number;
  woodWastePercent: number;
  quotationValidDays: number;
}

export interface ProduccionFurnitureCategoryDto {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionMaterialCategoryDto {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionProductionStageDto {
  id: string;
  stageKey: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionUnitDto {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionNumberingSeriesDto {
  seriesKey: string;
  prefix: string;
  lastNumber: number;
  padLength: number;
  includeYear: boolean;
  nextPreview: string;
}

export interface ProduccionFurnitureCategoryInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionMaterialCategoryInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionProductionStageInput {
  stageKey: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionUnitInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProduccionConfigRepository {
  ensureDefaults(applicationId: string): Promise<void>;
  getSettings(applicationId: string): Promise<ProduccionAppSettingsDto>;
  updateSettings(applicationId: string, data: Partial<ProduccionAppSettingsDto>): Promise<ProduccionAppSettingsDto>;
  listFurnitureCategories(applicationId: string): Promise<ProduccionFurnitureCategoryDto[]>;
  replaceFurnitureCategories(applicationId: string, rows: ProduccionFurnitureCategoryInput[]): Promise<void>;
  listMaterialCategories(applicationId: string): Promise<ProduccionMaterialCategoryDto[]>;
  replaceMaterialCategories(applicationId: string, rows: ProduccionMaterialCategoryInput[]): Promise<void>;
  listProductionStages(applicationId: string): Promise<ProduccionProductionStageDto[]>;
  replaceProductionStages(applicationId: string, rows: ProduccionProductionStageInput[]): Promise<void>;
  listUnits(applicationId: string): Promise<ProduccionUnitDto[]>;
  replaceUnits(applicationId: string, rows: ProduccionUnitInput[]): Promise<void>;
  listNumberingSeries(applicationId: string): Promise<ProduccionNumberingSeriesDto[]>;
  updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean },
  ): Promise<ProduccionNumberingSeriesDto>;
  allocateNextCode(applicationId: string, seriesKey: string): Promise<string>;
  previewNextCode(applicationId: string, seriesKey: string): Promise<string>;
}
