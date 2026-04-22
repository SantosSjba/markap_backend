import { Injectable, Inject } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '@common/constants/injection-tokens';
import type { PaymentRepository, ListPaymentHistoryResult } from '@domain/repositories/payment.repository';

export interface ListPaymentHistoryInput {
  applicationSlug: string;
  search?: string;
  periodYear?: number;
  periodMonth?: number;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListPaymentHistoryUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: ListPaymentHistoryInput): Promise<ListPaymentHistoryResult> {
    return this.paymentRepository.listHistory({
      applicationSlug: input.applicationSlug,
      search: input.search,
      periodYear: input.periodYear,
      periodMonth: input.periodMonth,
      paymentMethod: input.paymentMethod,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
    });
  }
}
