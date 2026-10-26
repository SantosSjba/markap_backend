import { Inject, Injectable } from '@nestjs/common';
import type {
  ListOverduePaymentsResult,
  PaymentRepository,
} from '../../../domain/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../../domain/repositories/payment.repository';

export interface ListOverduePaymentsInput {
  applicationSlug: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListOverduePaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(
    input: ListOverduePaymentsInput,
  ): Promise<ListOverduePaymentsResult> {
    // Marca como atrasadas las cuotas vencidas aunque no se haya abierto Pagos pendientes
    await this.paymentRepository.generateMonthlyPending(input.applicationSlug);
    return this.paymentRepository.listOverdue({
      applicationSlug: input.applicationSlug,
      search: input.search,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    });
  }
}
