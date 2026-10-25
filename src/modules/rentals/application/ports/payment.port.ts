import type {
  OverduePaymentItem,
  Payment,
  PaymentStats,
  PendingPaymentItem,
} from '../../domain/entities/payment.entity';
import type { ListPaymentHistoryResult } from '../../domain/repositories/payment.repository';
import type { ListPaymentHistoryInput } from '../use-cases/payments/list-payment-history.use-case';
import type { RegisterPaymentInput } from '../use-cases/payments/register-payment.use-case';

export const PAYMENT_PORT = Symbol('PaymentPort');

export interface PaymentPort {
  getStats(applicationSlug: string): Promise<PaymentStats>;
  listPending(filters: {
    applicationSlug: string;
    search?: string;
    status?: string;
  }): Promise<PendingPaymentItem[]>;
  registerPayment(input: RegisterPaymentInput): Promise<Payment>;
  listHistory(
    input: ListPaymentHistoryInput,
  ): Promise<ListPaymentHistoryResult>;
  listOverdue(
    applicationSlug: string,
    search?: string,
  ): Promise<OverduePaymentItem[]>;
}
