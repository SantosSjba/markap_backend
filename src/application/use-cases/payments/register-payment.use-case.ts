import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  PaymentRepository,
  PaymentData,
  PaymentMethod,
} from '../../repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../repositories/payment.repository';

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

  async execute(input: RegisterPaymentInput): Promise<PaymentData> {
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      throw new NotFoundException(`Pago con id ${input.paymentId} no encontrado`);
    }

    return this.paymentRepository.registerPayment(input.paymentId, {
      paidDate: input.paidDate,
      paidAmount: input.paidAmount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      registeredBy: input.registeredBy,
    });
  }
}
