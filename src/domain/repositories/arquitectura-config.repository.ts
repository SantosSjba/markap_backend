import type {
  ArquitecturaNumberingSeries,
  ArquitecturaProjectStage,
} from '@domain/entities/arquitectura-config.entity';

export type { ArquitecturaProjectStage, ArquitecturaNumberingSeries } from '@domain/entities/arquitectura-config.entity';

/** Cuerpo para reemplazar etapas (HTTP). */
export interface ArquitecturaProjectStageInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export const ARQUITECTURA_CONFIG_REPOSITORY = Symbol('ArquitecturaConfigRepository');

/** Serie de numeración para códigos visibles de proyecto (prefijo correlativo). */
export const ARQUITECTURA_PROJECT_SERIES_KEY = 'ARQUITECTURA_PROJECT';

export interface ArquitecturaConfigRepository {
  listProjectStages(applicationId: string): Promise<ArquitecturaProjectStage[]>;

  replaceProjectStages(applicationId: string, stages: ArquitecturaProjectStageInput[]): Promise<void>;

  getNumberingSeries(applicationId: string, seriesKey: string): Promise<ArquitecturaNumberingSeries | null>;

  updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<ArquitecturaNumberingSeries>;

  ensureDefaults(applicationId: string): Promise<void>;

  allocateNextCode(applicationId: string, seriesKey: string): Promise<string>;
}
