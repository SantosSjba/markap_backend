export const VENTAS_BUYER_PAYMENT_KINDS = [
  'DOWN_PAYMENT',
  'INSTALLMENT',
] as const;
export type VentasBuyerPaymentKind =
  (typeof VENTAS_BUYER_PAYMENT_KINDS)[number];

export const VENTAS_DOC_COST_TYPES = ['NOTARY', 'REGISTRY', 'OTHER'] as const;
export type VentasDocCostType = (typeof VENTAS_DOC_COST_TYPES)[number];

export interface ListBuyerPaymentsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  buyerClientId?: string;
  /** Pagos de un cierre concreto (ficha del proceso) */
  saleClosingId?: string;
  kind?: VentasBuyerPaymentKind;
  /** PENDING | PAID | OVERDUE (vencido y aún PENDING) */
  displayStatus?: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface ListCommissionsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  agentId?: string;
  /** Código de proceso o inmueble, comprador o asesor */
  search?: string;
  currency?: string;
}

/** Totales de comisiones de una moneda (nunca se suman monedas distintas) */
export interface CommissionCurrencyTotals {
  currency: string;
  count: number;
  netTotal: number;
  paidNet: number;
  pendingNet: number;
}

export interface CommissionStats {
  total: number;
  byStatus: {
    PENDING: number;
    PARTIAL: number;
    PAID: number;
    CANCELLED: number;
  };
  /** Asesores con algo pendiente de cobro */
  agentsWithPending: number;
  byCurrency: CommissionCurrencyTotals[];
}

export interface ListDocCostsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  saleClosingId?: string;
  buyerClientId?: string;
}

export const VENTAS_FINANZAS_REPOSITORY = Symbol('VentasFinanzasRepository');

export interface VentasFinanzasRepository {
  getAgentCommissionPercent(
    applicationId: string,
    agentId: string,
  ): Promise<number | null>;

  upsertAgentCommissionProfile(data: {
    applicationId: string;
    agentId: string;
    commissionPercent: number;
  }): Promise<unknown>;

  listAgentCommissionProfiles(applicationId: string): Promise<unknown[]>;

  listBuyerPayments(
    filters: ListBuyerPaymentsFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  createBuyerPayment(data: {
    applicationId: string;
    saleClosingId: string;
    kind: VentasBuyerPaymentKind;
    amount: number;
    currency: string;
    dueDate: Date;
    notes?: string | null;
  }): Promise<{ id: string }>;

  markBuyerPaymentPaid(
    id: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown>;

  listCommissions(
    filters: ListCommissionsFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  getCommissionStats(applicationSlug: string): Promise<CommissionStats>;

  markCommissionPaid(
    id: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown>;

  markCommissionPaymentPartPaid(
    partId: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown>;

  recalculateCommissionFromProfile(
    commissionId: string,
    applicationId: string,
  ): Promise<unknown>;

  /** Cambia el % o el monto fijo pactado; respeta cuotas pagadas y deja constancia en el proceso. */
  updateCommissionTerms(
    commissionId: string,
    applicationId: string,
    data: {
      calculationType: 'PERCENT' | 'FIXED';
      percent: number | null;
      fixedAmount: number | null;
      reason: string;
    },
  ): Promise<unknown>;

  /**
   * Cuánto del precio final ya está cubierto, en la moneda de la venta:
   * separación aplicada y pagos del comprador programados.
   */
  getClosingPaymentCoverage(
    saleClosingId: string,
    applicationId: string,
  ): Promise<{
    currency: string;
    finalPrice: number;
    separationAmount: number;
    scheduledPayments: number;
  } | null>;

  /** Moneda de la venta de un cierre (moneda de precio del inmueble). */
  getClosingCurrency(
    saleClosingId: string,
    applicationId: string,
  ): Promise<string | null>;

  listDocumentationCosts(
    filters: ListDocCostsFilters,
  ): Promise<{ data: unknown[]; total: number }>;

  createDocumentationCost(data: {
    applicationId: string;
    saleClosingId: string;
    costType: VentasDocCostType;
    amount: number;
    currency: string;
    description?: string | null;
    expenseDate: Date;
  }): Promise<{ id: string }>;

  getClosingProfitability(
    closingId: string,
    applicationId: string,
  ): Promise<unknown>;

  saleClosingBelongsToApplication(
    saleClosingId: string,
    applicationId: string,
  ): Promise<boolean>;
}
