export const VENTAS_PIPELINE_STAGES = [
  'SEPARATION',
  'ARRAS',
  'MINUTA',
  'PUBLIC_DEED',
] as const;
export type VentasPipelineStage = (typeof VENTAS_PIPELINE_STAGES)[number];

export const VENTAS_SALE_PROCESS_STATUS = ['ACTIVE', 'WON', 'LOST'] as const;
export type VentasSaleProcessStatus =
  (typeof VENTAS_SALE_PROCESS_STATUS)[number];

export const VENTAS_SEPARATION_STATUS = [
  'ACTIVE',
  'EXPIRED',
  'CLOSED',
] as const;
export type VentasSeparationStatus = (typeof VENTAS_SEPARATION_STATUS)[number];

export const VENTAS_PAYMENT_TYPES = ['CASH', 'CREDIT'] as const;
export type VentasPaymentType = (typeof VENTAS_PAYMENT_TYPES)[number];

export const VENTAS_COMMISSION_STATUS = [
  'PENDING',
  'PARTIAL',
  'PAID',
  'CANCELLED',
] as const;

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
  /** Comprador, inmueble o código de proceso */
  search?: string;
}

export interface ListSaleClosingsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
}

export const VENTAS_SALES_REPOSITORY = Symbol('VentasSalesRepository');

/** Qué operaciones de Ventas dependen de un inmueble, cliente o asesor. */
export interface VentasSalesUsage {
  activeProcesses: number;
  activeSeparations: number;
  closings: number;
  /** Comisiones pendientes o pagadas en parte (solo para asesores) */
  openCommissions: number;
  /** Cuotas de comisión ya pagadas en procesos activos (solo para inmuebles) */
  paidCommissionPartsOnActive: number;
}

export interface VentasSalesRepository {
  getSalesUsage(
    applicationId: string,
    ref: { propertyId?: string; clientId?: string; agentId?: string },
  ): Promise<VentasSalesUsage>;

  /**
   * Tras editar el inmueble, alinea sus procesos activos: propietarios y comisiones en %
   * aún sin cierre (monto según el nuevo precio y moneda del precio).
   */
  syncActiveProcessesWithProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<void>;

  /** `VENTA-<año>-<código del inmueble>` sin repetir */
  nextProcessCode(
    applicationId: string,
    propertyCode: string,
    year: number,
  ): Promise<string>;

  createSaleProcess(data: {
    applicationId: string;
    code: string;
    buyerClientId: string;
    buyerClientIds?: string[];
    propertyId: string;
    ownerClientIds?: string[];
    agentId?: string | null;
    pipelineStage: VentasPipelineStage;
    title?: string | null;
    financingChannelId?: string | null;
    commissions?: {
      agentId: string;
      calculationType: 'PERCENT' | 'FIXED';
      amount: number;
      currency: string;
      percentApplied?: number | null;
      paymentParts?: {
        partNumber: number;
        label: string | null;
        amount: number;
        dueDate: Date | null;
      }[];
      deductibles?: {
        deductibleType: string;
        description: string | null;
        amount: number;
      }[];
    }[];
  }): Promise<{ id: string }>;

  countProcessCommissions(
    saleProcessId: string,
    applicationId: string,
  ): Promise<number>;

  listSaleProcesses(
    filters: ListSaleProcessesFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  /** Resumen de procesos para las tarjetas del listado */
  getSaleProcessStats(applicationId: string): Promise<SaleProcessStats>;

  getSaleProcessById(id: string, applicationId: string): Promise<unknown>;

  /** Rellena vínculos de propietario si el proceso se creó sin ellos (legacy). */
  ensureSaleProcessOwnerLinksFromProperty(
    saleProcessId: string,
    propertyId: string,
  ): Promise<void>;

  updateSaleProcess(
    id: string,
    applicationId: string,
    data: {
      pipelineStage?: VentasPipelineStage;
      status?: VentasSaleProcessStatus;
      agentId?: string | null;
      title?: string | null;
      financingChannelId?: string | null;
      closedAt?: Date | null;
      lostReason?: string | null;
    },
    /** Constancia en el seguimiento (p. ej. cambio de etapa), en la misma transacción */
    activity?: { title: string; description: string },
  ): Promise<unknown>;

  /** Anula comisiones del proceso (venta caída). */
  cancelProcessCommissions(
    saleProcessId: string,
    applicationId: string,
  ): Promise<number>;

  /** Marca proceso LOST, anula comisiones y registra actividad (transacción atómica). */
  applySaleProcessLost(
    saleProcessId: string,
    applicationId: string,
    data: { lostReason: string; closedAt: Date; activityDescription: string },
  ): Promise<unknown>;

  listSaleFinancingChannels(): Promise<unknown[]>;

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
      receiptArchivoId?: string | null;
      notes?: string | null;
      expiresAt?: Date | null;
    },
  ): Promise<unknown>;

  getSaleSeparationById(id: string, applicationId: string): Promise<unknown>;

  /** Resumen de separaciones para las tarjetas del listado */
  getSaleSeparationStats(applicationId: string): Promise<SaleSeparationStats>;

  /** Proceso activo del inmueble en el que participa el comprador (para vincular la separación) */
  findActiveProcessForSeparation(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<{ id: string } | null>;

  listActiveSeparationsOnProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<{ id: string; buyerClientId: string }[]>;

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
  ): Promise<unknown>;

  updateSaleClosingContractFile(
    closingId: string,
    applicationId: string,
    file: { filePath: string; archivoId?: string | null },
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
    /** Comisión manual en cierre si el proceso no tiene comisiones */
    commissionAgentId?: string | null;
    commissionAmount: number;
    commissionPercent?: number | null;
  }): Promise<{ closingId: string; commissionId: string } | null>;
}

export interface SaleProcessStats {
  total: number;
  active: number;
  won: number;
  lost: number;
  /** Procesos creados en el mes en curso */
  createdThisMonth: number;
  /** Procesos activos por etapa del pipeline */
  activeByStage: Record<string, number>;
  /** Precio de lista de los inmuebles en procesos activos, por moneda (no se suman entre sí) */
  activeValueByCurrency: { currency: string; amount: number; count: number }[];
}

export interface SaleSeparationStats {
  active: number;
  expired: number;
  closed: number;
  /** Activas cuya fecha de vencimiento ya pasó o vence en los próximos 7 días */
  expiringSoon: number;
  /** Monto de separaciones activas por moneda */
  activeAmountByCurrency: { currency: string; amount: number }[];
}
