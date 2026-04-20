export interface VentasPipelineStageDTO {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface VentasNumberingSeriesDTO {
  seriesKey: string;
  prefix: string;
  lastNumber: number;
}

export const VENTAS_CONFIG_REPOSITORY = Symbol('VentasConfigRepository');

export interface VentasConfigRepository {
  listPipelineStages(applicationId: string): Promise<VentasPipelineStageDTO[]>;

  replacePipelineStages(applicationId: string, stages: VentasPipelineStageDTO[]): Promise<void>;

  getNumberingSeries(
    applicationId: string,
    seriesKey: string,
  ): Promise<VentasNumberingSeriesDTO | null>;

  updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<VentasNumberingSeriesDTO>;

  /** Crea filas por defecto si no existen (idempotente). */
  ensureDefaults(applicationId: string): Promise<void>;

  /** Catálogo global de tipos de inmueble (solo lectura para pantalla Ventas). */
  listActivePropertyTypes(): Promise<{ id: string; name: string; code: string }[]>;
}
