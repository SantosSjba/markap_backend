import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '@common/constants/injection-tokens';
import type {
  PaymentRepository,
  Payment,
  PaymentMethod,
} from '@domain/repositories/payment.repository';
import { Money } from '@domain/value-objects';

export interface RegisterPaymentInput {
  paymentId: string;
  paidDate: Date;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  registeredBy?: string | null;
}

@Injectable()
export class RegisterPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: RegisterPaymentInput): Promise<Payment> {
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      throw new NotFoundException(`Pago con id ${input.paymentId} no encontrado`);
    }

    const paid = Money.create(input.paidAmount, payment.currency);
    return this.paymentRepository.registerPayment(input.paymentId, {
      paidDate: input.paidDate,
      paidAmount: paid.amount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      registeredBy: input.registeredBy,
    });
  }
}
