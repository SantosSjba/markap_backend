// ============================================================
// Payment — Puerto del repositorio (capa de dominio)
// Las implementaciones concretas viven en Infraestructura.
// ============================================================

import type {
  PaymentMethod,
  PaymentStatus,
  Payment,
  PendingPaymentItem,
  PaymentHistoryItem,
  OverduePaymentItem,
  PaymentStats,
} from '@domain/entities/payment.entity';

export type {
  PaymentMethod,
  PaymentStatus,
  Payment,
  PendingPaymentItem,
  PaymentHistoryItem,
  OverduePaymentItem,
  PaymentStats,
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
  totalAmount: number;
  page: number;
  limit: number;
}

export interface PaymentRepository {
  generateMonthlyPending(applicationSlug: string): Promise<number>;

  listPending(filters: ListPendingPaymentsFilters): Promise<PendingPaymentItem[]>;

  registerPayment(paymentId: string, data: RegisterPaymentData): Promise<Payment>;

  listHistory(filters: ListPaymentHistoryFilters): Promise<ListPaymentHistoryResult>;

  listOverdue(applicationSlug: string, search?: string): Promise<OverduePaymentItem[]>;

  getStats(applicationSlug: string): Promise<PaymentStats>;

  findById(id: string): Promise<Payment | null>;
}

export const PAYMENT_REPOSITORY = Symbol('PaymentRepository');
