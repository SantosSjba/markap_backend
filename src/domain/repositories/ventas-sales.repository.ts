export const VENTAS_PIPELINE_STAGES = [
  'PROSPECT',
  'VISIT',
  'NEGOTIATION',
  'SEPARATION',
  'CLOSING',
] as const;
export type VentasPipelineStage = (typeof VENTAS_PIPELINE_STAGES)[number];

export const VENTAS_SALE_PROCESS_STATUS = ['ACTIVE', 'WON', 'LOST'] as const;
export type VentasSaleProcessStatus = (typeof VENTAS_SALE_PROCESS_STATUS)[number];

export const VENTAS_SEPARATION_STATUS = ['ACTIVE', 'EXPIRED', 'CLOSED'] as const;
export type VentasSeparationStatus = (typeof VENTAS_SEPARATION_STATUS)[number];

export const VENTAS_PAYMENT_TYPES = ['CASH', 'CREDIT'] as const;
export type VentasPaymentType = (typeof VENTAS_PAYMENT_TYPES)[number];

export const VENTAS_COMMISSION_STATUS = ['PENDING', 'PAID'] as const;

export interface ListSaleProcessesFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  pipelineStage?: VentasPipelineStage;
  status?: VentasSaleProcessStatus;
}

export interface ListSaleSeparationsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  status?: VentasSeparationStatus;
}

export interface ListSaleClosingsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
}

export const VENTAS_SALES_REPOSITORY = Symbol('VentasSalesRepository');

export interface VentasSalesRepository {
  nextProcessCode(applicationId: string): Promise<string>;

  createSaleProcess(data: {
    applicationId: string;
    code: string;
    buyerClientId: string;
    propertyId: string;
    agentId?: string | null;
    pipelineStage: VentasPipelineStage;
    title?: string | null;
  }): Promise<{ id: string }>;

  listSaleProcesses(
    filters: ListSaleProcessesFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  getSaleProcessById(
    id: string,
    applicationId: string,
  ): Promise<unknown | null>;

  updateSaleProcess(
    id: string,
    applicationId: string,
    data: {
      pipelineStage?: VentasPipelineStage;
      status?: VentasSaleProcessStatus;
      agentId?: string | null;
      title?: string | null;
      closedAt?: Date | null;
    },
  ): Promise<unknown>;

  addSaleProcessNote(
    saleProcessId: string,
    applicationId: string,
    body: string,
    createdBy?: string | null,
  ): Promise<unknown>;

  addSaleProcessActivity(data: {
    saleProcessId: string;
    applicationId: string;
    activityType: string;
    title: string;
    description?: string | null;
    scheduledAt?: Date | null;
    completedAt?: Date | null;
  }): Promise<unknown>;

  addSaleProcessReminder(data: {
    saleProcessId: string;
    applicationId: string;
    title: string;
    dueAt: Date;
  }): Promise<unknown>;

  completeSaleProcessReminder(
    reminderId: string,
    applicationId: string,
  ): Promise<unknown>;

  listSaleSeparations(
    filters: ListSaleSeparationsFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  createSaleSeparation(data: {
    applicationId: string;
    saleProcessId?: string | null;
    propertyId: string;
    buyerClientId: string;
    amount: number;
    currency: string;
    separationDate: Date;
    expiresAt?: Date | null;
    notes?: string | null;
  }): Promise<{ id: string } | null>;

  updateSaleSeparation(
    id: string,
    applicationId: string,
    data: {
      status?: VentasSeparationStatus;
      receiptFilePath?: string | null;
      notes?: string | null;
      expiresAt?: Date | null;
    },
  ): Promise<unknown>;

  getSaleSeparationById(
    id: string,
    applicationId: string,
  ): Promise<unknown | null>;

  countActiveSeparationsOnProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<number>;

  /** Si no hay separaciones ACTIVAS, pone la propiedad en AVAILABLE. */
  refreshPropertyListingAfterSeparationChange(
    propertyId: string,
    applicationId: string,
  ): Promise<void>;

  /** Al reactivar separación, asegura inmueble en RESERVED (si no está SOLD). */
  ensurePropertyReservedForSeparation(
    propertyId: string,
    applicationId: string,
  ): Promise<boolean>;

  listSaleClosings(
    filters: ListSaleClosingsFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  getSaleClosingById(
    closingId: string,
    applicationId: string,
  ): Promise<unknown | null>;

  updateSaleClosingContractFile(
    closingId: string,
    applicationId: string,
    contractFilePath: string,
  ): Promise<unknown>;

  createSaleClosingWithSideEffects(data: {
    applicationId: string;
    saleProcessId?: string | null;
    saleSeparationId?: string | null;
    propertyId: string;
    buyerClientId: string;
    agentId?: string | null;
    finalPrice: number;
    paymentType: VentasPaymentType;
    contractFilePath?: string | null;
    notes?: string | null;
    /** Agente al que se registra la comisión (obligatorio) */
    commissionAgentId: string;
    commissionAmount: number;
    commissionPercent?: number | null;
  }): Promise<{ closingId: string; commissionId: string } | null>;
}
