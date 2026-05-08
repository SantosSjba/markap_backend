import type {
  InteriorismoNumberingSeries,
  InteriorismoProjectStage,
} from '@domain/entities/interiorismo-config.entity';

export type { InteriorismoProjectStage, InteriorismoNumberingSeries } from '@domain/entities/interiorismo-config.entity';

/** Cuerpo para reemplazar etapas (HTTP). */
export interface InteriorismoProjectStageInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export const INTERIORISMO_CONFIG_REPOSITORY = Symbol('InteriorismoConfigRepository');

/** Serie de numeración para códigos visibles de proyecto (prefijo correlativo). */
export const INTERIOR_PROJECT_SERIES_KEY = 'INTERIOR_PROJECT';

export interface InteriorismoConfigRepository {
  listProjectStages(applicationId: string): Promise<InteriorismoProjectStage[]>;

  replaceProjectStages(applicationId: string, stages: InteriorismoProjectStageInput[]): Promise<void>;

  getNumberingSeries(applicationId: string, seriesKey: string): Promise<InteriorismoNumberingSeries | null>;

  updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<InteriorismoNumberingSeries>;

  ensureDefaults(applicationId: string): Promise<void>;
}
