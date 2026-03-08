import { Injectable, Inject } from '@nestjs/common';
import type {
  PaymentRepository,
  OverduePaymentItem,
} from '../../repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../repositories/payment.repository';

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
