import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { startOfTodayLima } from '../../../../../shared/domain/utils/peru-date.util';
import { Money } from '../../../../../shared/domain/value-objects/money.value-object';
import type {
  Payment,
  PaymentMethod,
} from '../../../domain/entities/payment.entity';
import type { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../../domain/repositories/payment.repository';

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
      throw new NotFoundException(
        `Pago con id ${input.paymentId} no encontrado`,
      );
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException('Esta cuota ya está pagada.');
    }
    if (input.paidDate > startOfTodayLima()) {
      throw new BadRequestException('La fecha de pago no puede ser futura.');
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
