import type {
  VentasNumberingSeries,
  VentasPipelineStage,
  VentasPropertyTypeCatalogItem,
} from '../entities/ventas-config.entity';

export type {
  VentasNumberingSeries,
  VentasPipelineStage,
  VentasPropertyTypeCatalogItem,
} from '../entities/ventas-config.entity';

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

  replacePipelineStages(
    applicationId: string,
    stages: VentasPipelineStageInput[],
  ): Promise<void>;

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

  /** Catálogo de bancos y medios de pago (incluye inactivos) */
  listFinancingChannels(): Promise<VentasFinancingChannel[]>;
  findFinancingChannelCodes(prefix: string): Promise<string[]>;
  createFinancingChannel(data: {
    category: string;
    code: string;
    name: string;
    sortOrder: number;
  }): Promise<VentasFinancingChannel>;
  updateFinancingChannel(
    id: string,
    data: {
      category?: string;
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ): Promise<VentasFinancingChannel | null>;
}

export interface VentasFinancingChannel {
  id: string;
  category: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  /** Procesos que lo usan */
  usage: number;
}
