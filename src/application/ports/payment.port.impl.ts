import { Injectable } from '@nestjs/common';
import type { PaymentStats } from '@domain/entities/payment.entity';
import type { PendingPaymentItem, Payment, ListPaymentHistoryResult } from '@domain/repositories/payment.repository';
import { GetPaymentStatsUseCase } from '../use-cases/payments/get-payment-stats.use-case';
import { ListPendingPaymentsUseCase } from '../use-cases/payments/list-pending-payments.use-case';
import { RegisterPaymentUseCase, type RegisterPaymentInput } from '../use-cases/payments/register-payment.use-case';
import { ListPaymentHistoryUseCase, type ListPaymentHistoryInput } from '../use-cases/payments/list-payment-history.use-case';
import { ListOverduePaymentsUseCase } from '../use-cases/payments/list-overdue-payments.use-case';
import type { PaymentPort } from './payment.port';

@Injectable()
export class PaymentPortImpl implements PaymentPort {
  constructor(
    private readonly statsUc: GetPaymentStatsUseCase,
    private readonly pendingUc: ListPendingPaymentsUseCase,
    private readonly registerUc: RegisterPaymentUseCase,
    private readonly historyUc: ListPaymentHistoryUseCase,
    private readonly overdueUc: ListOverduePaymentsUseCase,
  ) {}

  getStats(applicationSlug: string): Promise<PaymentStats> {
    return this.statsUc.execute(applicationSlug);
  }

  listPending(filters: {
    applicationSlug: string;
    search?: string;
    status?: string;
  }): Promise<PendingPaymentItem[]> {
    return this.pendingUc.execute(filters);
  }

  registerPayment(input: RegisterPaymentInput): Promise<Payment> {
    return this.registerUc.execute(input);
  }

  listHistory(input: ListPaymentHistoryInput): Promise<ListPaymentHistoryResult> {
    return this.historyUc.execute(input);
  }

  listOverdue(applicationSlug: string, search?: string) {
    return this.overdueUc.execute(applicationSlug, search);
  }
}
