import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
} from '../../../../../shared/presentation/validation/input-schemas';

import type { PaymentMethod } from '../../../domain/entities/payment.entity';

const PAYMENT_METHODS: PaymentMethod[] = [
  'CASH',
  'TRANSFER',
  'DEPOSIT',
  'YAPE',
  'PLIN',
  'CHECK',
  'OTHER',
];

/** Body de POST /payments/:id/register */
export class RegisterPaymentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    paidDate: isoDateInput,
    paidAmount: z.preprocess(
      numericValue,
      z.number({ error: 'El campo «monto pagado» debe ser un número válido.' }),
    ),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      error: 'El campo «método de pago» no es una opción permitida.',
    }),
    referenceNumber: z
      .string({ error: 'El campo «número de operación» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty({
    example: '2024-06-15',
    description: 'Fecha de pago (ISO date)',
  })
  paidDate!: string;

  @ApiProperty({ example: 1200.5 })
  paidAmount!: number;

  @ApiProperty({ enum: PAYMENT_METHODS, example: 'TRANSFER' })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ nullable: true })
  referenceNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}
