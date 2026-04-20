import type {
  VentasPipelineStage,
  VentasNumberingSeries,
  VentasPropertyTypeCatalogItem,
} from '@domain/entities/ventas-config.entity';

export type {
  VentasPipelineStage,
  VentasNumberingSeries,
  VentasPropertyTypeCatalogItem,
} from '@domain/entities/ventas-config.entity';

/** Cuerpo para reemplazar etapas (HTTP / aplicación); no es fila persistida. */
export interface VentasPipelineStageInput {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export const VENTAS_CONFIG_REPOSITORY = Symbol('VentasConfigRepository');

export interface VentasConfigRepository {
  listPipelineStages(applicationId: string): Promise<VentasPipelineStage[]>;

  replacePipelineStages(applicationId: string, stages: VentasPipelineStageInput[]): Promise<void>;

  getNumberingSeries(
    applicationId: string,
    seriesKey: string,
  ): Promise<VentasNumberingSeries | null>;

  updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<VentasNumberingSeries>;

  ensureDefaults(applicationId: string): Promise<void>;

  listActivePropertyTypes(): Promise<VentasPropertyTypeCatalogItem[]>;
}
