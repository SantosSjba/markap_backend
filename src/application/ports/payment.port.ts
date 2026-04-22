import type { OverduePaymentItem, PaymentStats } from '@domain/entities/payment.entity';
import type { PendingPaymentItem, Payment, ListPaymentHistoryResult } from '@domain/repositories/payment.repository';
import type { RegisterPaymentInput } from '../use-cases/payments/register-payment.use-case';
import type { ListPaymentHistoryInput } from '../use-cases/payments/list-payment-history.use-case';

export const PAYMENT_PORT = Symbol('PaymentPort');

export interface PaymentPort {
  getStats(applicationSlug: string): Promise<PaymentStats>;
  listPending(filters: {
    applicationSlug: string;
    search?: string;
    status?: string;
  }): Promise<PendingPaymentItem[]>;
  registerPayment(input: RegisterPaymentInput): Promise<Payment>;
  listHistory(input: ListPaymentHistoryInput): Promise<ListPaymentHistoryResult>;
  listOverdue(applicationSlug: string, search?: string): Promise<OverduePaymentItem[]>;
}
