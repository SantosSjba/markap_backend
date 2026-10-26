import { Inject, Injectable } from '@nestjs/common';
import type { PaymentStatus } from '../../../domain/entities/payment.entity';
import type {
  ListPendingPaymentsResult,
  PaymentRepository,
} from '../../../domain/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../../domain/repositories/payment.repository';

export interface ListPendingPaymentsInput {
  applicationSlug: string;
  search?: string;
  status?: string;
  rentalId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListPendingPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(
    input: ListPendingPaymentsInput,
  ): Promise<ListPendingPaymentsResult> {
    await this.paymentRepository.generateMonthlyPending(input.applicationSlug);

    return this.paymentRepository.listPending({
      applicationSlug: input.applicationSlug,
      search: input.search,
      status: (input.status as PaymentStatus | 'ALL') || 'ALL',
      rentalId: input.rentalId,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
    });
  }
}
