import type {
  Payment,
  PaymentStats,
} from '../../domain/entities/payment.entity';
import type {
  ListOverduePaymentsResult,
  ListPaymentHistoryResult,
  ListPendingPaymentsResult,
} from '../../domain/repositories/payment.repository';
import type { ListOverduePaymentsInput } from '../use-cases/payments/list-overdue-payments.use-case';
import type { ListPendingPaymentsInput } from '../use-cases/payments/list-pending-payments.use-case';
import type { ListPaymentHistoryInput } from '../use-cases/payments/list-payment-history.use-case';
import type { RegisterPaymentInput } from '../use-cases/payments/register-payment.use-case';

export const PAYMENT_PORT = Symbol('PaymentPort');

export interface PaymentPort {
  getStats(applicationSlug: string): Promise<PaymentStats>;
  listPending(
    input: ListPendingPaymentsInput,
  ): Promise<ListPendingPaymentsResult>;
  registerPayment(input: RegisterPaymentInput): Promise<Payment>;
  listHistory(
    input: ListPaymentHistoryInput,
  ): Promise<ListPaymentHistoryResult>;
  listOverdue(
    input: ListOverduePaymentsInput,
  ): Promise<ListOverduePaymentsResult>;
}
