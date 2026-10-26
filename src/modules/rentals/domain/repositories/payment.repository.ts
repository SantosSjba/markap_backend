// ============================================================
// Payment — Puerto del repositorio (capa de dominio)
// Las implementaciones concretas viven en Infraestructura.
// ============================================================

import type {
  OverdueSummary,
  OverduePaymentItem,
  Payment,
  PaymentCurrencyAmount,
  PaymentHistoryItem,
  PaymentMethod,
  PaymentStats,
  PaymentStatus,
  PendingPaymentItem,
} from '../entities/payment.entity';

export type {
  OverdueSummary,
  OverduePaymentItem,
  Payment,
  PaymentCurrencyAmount,
  PaymentHistoryItem,
  PaymentMethod,
  PaymentStats,
  PaymentStatus,
  PendingPaymentItem,
};

export interface RegisterPaymentData {
  paidDate: Date;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  registeredBy?: string | null;
}

export interface ListPendingPaymentsFilters {
  applicationSlug: string;
  search?: string;
  status?: PaymentStatus | 'ALL';
  /** Solo las cuotas de un contrato (cobro desde Atrasos) */
  rentalId?: string;
  page: number;
  limit: number;
}

export interface ListPendingPaymentsResult {
  data: PendingPaymentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ListOverduePaymentsFilters {
  applicationSlug: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ListOverduePaymentsResult {
  data: OverduePaymentItem[];
  total: number;
  page: number;
  limit: number;
  summary: OverdueSummary;
}

export interface ListPaymentHistoryFilters {
  applicationSlug: string;
  search?: string;
  periodYear?: number;
  periodMonth?: number;
  paymentMethod?: string;
  page: number;
  limit: number;
}

export interface ListPaymentHistoryResult {
  data: PaymentHistoryItem[];
  total: number;
  /** Suma de todas las monedas (compatibilidad); usar `totalsByCurrency` */
  totalAmount: number;
  totalsByCurrency: PaymentCurrencyAmount[];
  page: number;
  limit: number;
}

export interface PaymentRepository {
  generateMonthlyPending(applicationSlug: string): Promise<number>;

  listPending(
    filters: ListPendingPaymentsFilters,
  ): Promise<ListPendingPaymentsResult>;

  registerPayment(
    paymentId: string,
    data: RegisterPaymentData,
  ): Promise<Payment>;

  listHistory(
    filters: ListPaymentHistoryFilters,
  ): Promise<ListPaymentHistoryResult>;

  listOverdue(
    filters: ListOverduePaymentsFilters,
  ): Promise<ListOverduePaymentsResult>;

  getStats(applicationSlug: string): Promise<PaymentStats>;

  findById(id: string): Promise<Payment | null>;
}

export const PAYMENT_REPOSITORY = Symbol('PaymentRepository');
