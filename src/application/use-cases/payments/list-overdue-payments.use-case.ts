import { Injectable, Inject } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '@common/constants/injection-tokens';
import type { PaymentRepository, OverduePaymentItem } from '@domain/repositories/payment.repository';

@Injectable()
export class ListOverduePaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(applicationSlug: string, search?: string): Promise<OverduePaymentItem[]> {
    return this.paymentRepository.listOverdue(applicationSlug, search);
  }
}
