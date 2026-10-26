import { Injectable } from '@nestjs/common';
import type {
  Payment,
  PaymentStats,
} from '../../domain/entities/payment.entity';
import type {
  ListOverduePaymentsResult,
  ListPaymentHistoryResult,
  ListPendingPaymentsResult,
} from '../../domain/repositories/payment.repository';
import type { PaymentPort } from '../ports/payment.port';
import { GetPaymentStatsUseCase } from '../use-cases/payments/get-payment-stats.use-case';
import {
  ListOverduePaymentsUseCase,
  type ListOverduePaymentsInput,
} from '../use-cases/payments/list-overdue-payments.use-case';
import {
  ListPaymentHistoryUseCase,
  type ListPaymentHistoryInput,
} from '../use-cases/payments/list-payment-history.use-case';
import {
  ListPendingPaymentsUseCase,
  type ListPendingPaymentsInput,
} from '../use-cases/payments/list-pending-payments.use-case';
import {
  RegisterPaymentUseCase,
  type RegisterPaymentInput,
} from '../use-cases/payments/register-payment.use-case';

@Injectable()
export class PaymentFacade implements PaymentPort {
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

  listPending(
    input: ListPendingPaymentsInput,
  ): Promise<ListPendingPaymentsResult> {
    return this.pendingUc.execute(input);
  }

  registerPayment(input: RegisterPaymentInput): Promise<Payment> {
    return this.registerUc.execute(input);
  }

  listHistory(
    input: ListPaymentHistoryInput,
  ): Promise<ListPaymentHistoryResult> {
    return this.historyUc.execute(input);
  }

  listOverdue(
    input: ListOverduePaymentsInput,
  ): Promise<ListOverduePaymentsResult> {
    return this.overdueUc.execute(input);
  }
}
