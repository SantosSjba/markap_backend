import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

const STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;
const PAYMENT_TYPES = ['ABONO', 'PAGO_FINAL', 'SALDO', 'OTHER'] as const;

export class CreateInteriorFinancePaymentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    paidAt: isoDateInput,
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «importe» debe ser un número válido.' })
        .min(0.01, {
          error: 'El campo «importe» es menor que el mínimo permitido.',
        }),
    ),
    concept: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «concepto» debe ser un texto.' })
        .max(2000, { error: 'El campo «concepto» es demasiado largo.' }),
    ),
    status: z.preprocess(
      primitiveText,
      z.enum(STATUSES, {
        error: 'El campo «estado» no es una opción permitida.',
      }),
    ),
    paymentType: z
      .preprocess(
        primitiveText,
        z.enum(PAYMENT_TYPES, {
          error: 'El campo «tipo de pago» no es una opción permitida.',
        }),
      )
      .nullish(),
    currency: z
      .preprocess(
        primitiveText,
        z.enum(['PEN', 'USD', 'EUR'], {
          error: 'El campo «moneda» no es una opción permitida.',
        }),
      )
      .nullish(),
    exchangeRate: z
      .number({ error: 'El campo «tipo de cambio» debe ser un número.' })
      .positive({ error: 'El tipo de cambio debe ser mayor que cero.' })
      .nullish(),
    scheduleItemId: z
      .string({ error: 'El campo «cuota» no es válido.' })
      .uuid({ error: 'El campo «cuota» no es válido.' })
      .nullish(),
  });

  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  paidAt!: string;

  @ApiProperty({ example: 2500 })
  amount!: number;

  @ApiProperty({ example: 'Transferencia — adelanto' })
  concept!: string;

  @ApiProperty({ enum: STATUSES })
  status!: string;

  @ApiPropertyOptional({ enum: PAYMENT_TYPES, default: 'OTHER' })
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Cuota programada (opcional)' })
  scheduleItemId?: string | null;

  @ApiPropertyOptional({
    enum: ['PEN', 'USD', 'EUR'],
    description: 'Moneda del cobro (por defecto la del presupuesto)',
  })
  currency?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo de cambio del día (soles por unidad)',
    example: 3.75,
  })
  exchangeRate?: number | null;
}
