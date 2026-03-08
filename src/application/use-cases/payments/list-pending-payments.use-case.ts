import { Injectable, Inject } from '@nestjs/common';
import type {
  PaymentRepository,
  PendingPaymentItem,
  ListPendingPaymentsFilters,
  PaymentStatus,
} from '../../repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../repositories/payment.repository';

@Injectable()
export class ListPendingPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(filters: {
    applicationSlug: string;
    search?: string;
    status?: string;
  }): Promise<PendingPaymentItem[]> {
    await this.paymentRepository.generateMonthlyPending(filters.applicationSlug);

    const normalized: ListPendingPaymentsFilters = {
      applicationSlug: filters.applicationSlug,
      search: filters.search,
      status: (filters.status as PaymentStatus | 'ALL') || 'ALL',
    };

    return this.paymentRepository.listPending(normalized);
  }
}
