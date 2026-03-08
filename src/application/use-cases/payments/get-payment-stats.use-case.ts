import { Injectable, Inject } from '@nestjs/common';
import type {
  PaymentRepository,
  PaymentStats,
} from '../../repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../repositories/payment.repository';

@Injectable()
export class GetPaymentStatsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(applicationSlug: string): Promise<PaymentStats> {
    // Genera los pagos del mes si aún no existen, luego devuelve stats
    await this.paymentRepository.generateMonthlyPending(applicationSlug);
    return this.paymentRepository.getStats(applicationSlug);
  }
}
