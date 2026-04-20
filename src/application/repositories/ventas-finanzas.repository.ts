export const VENTAS_BUYER_PAYMENT_KINDS = ['DOWN_PAYMENT', 'INSTALLMENT'] as const;
export type VentasBuyerPaymentKind = (typeof VENTAS_BUYER_PAYMENT_KINDS)[number];

export const VENTAS_DOC_COST_TYPES = ['NOTARY', 'REGISTRY', 'OTHER'] as const;
export type VentasDocCostType = (typeof VENTAS_DOC_COST_TYPES)[number];

export interface ListBuyerPaymentsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  buyerClientId?: string;
  kind?: VentasBuyerPaymentKind;
  /** PENDING | PAID | OVERDUE (vencido y aún PENDING) */
  displayStatus?: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface ListCommissionsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  status?: 'PENDING' | 'PAID';
  agentId?: string;
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
  getAgentCommissionPercent(applicationId: string, agentId: string): Promise<number | null>;

  upsertAgentCommissionProfile(data: {
    applicationId: string;
    agentId: string;
    commissionPercent: number;
  }): Promise<unknown>;

  listAgentCommissionProfiles(applicationId: string): Promise<unknown[]>;

  listBuyerPayments(filters: ListBuyerPaymentsFilters): Promise<{ data: unknown[]; total: number }>;

  createBuyerPayment(data: {
    applicationId: string;
    saleClosingId: string;
    kind: VentasBuyerPaymentKind;
    amount: number;
    currency: string;
    dueDate: Date;
    notes?: string | null;
  }): Promise<{ id: string }>;

  markBuyerPaymentPaid(id: string, applicationId: string, paidAt?: Date): Promise<unknown | null>;

  listCommissions(filters: ListCommissionsFilters): Promise<{ data: unknown[]; total: number }>;

  markCommissionPaid(id: string, applicationId: string, paidAt?: Date): Promise<unknown | null>;

  recalculateCommissionFromProfile(
    commissionId: string,
    applicationId: string,
  ): Promise<unknown | null>;

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

  getClosingProfitability(closingId: string, applicationId: string): Promise<unknown | null>;

  saleClosingBelongsToApplication(saleClosingId: string, applicationId: string): Promise<boolean>;
}
