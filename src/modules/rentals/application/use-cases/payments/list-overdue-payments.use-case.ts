import { Inject, Injectable } from '@nestjs/common';
import type { OverduePaymentItem } from '../../../domain/entities/payment.entity';
import type { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../../domain/repositories/payment.repository';

@Injectable()
export class ListOverduePaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(
    applicationSlug: string,
    search?: string,
  ): Promise<OverduePaymentItem[]> {
    return this.paymentRepository.listOverdue(applicationSlug, search);
  }
}
