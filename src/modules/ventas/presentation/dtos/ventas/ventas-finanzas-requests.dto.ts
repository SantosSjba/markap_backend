import { z } from 'zod';
import {
  dateOnlyInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class MarkPaidDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    paidAt: optionalValue(
      z.string({ error: 'El campo «fecha de pago» debe ser un texto.' }),
    ),
  });

  paidAt?: string | null;
}

export class CreateDocumentationCostDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    saleClosingId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cierre de venta» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cierre de venta» es obligatorio.',
        }),
    ),
    costType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «costType» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «costType» es obligatorio.' }),
    ),
    amount: numericInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    currency: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
    expenseDate: optionalValue(dateOnlyInput),
  });

  saleClosingId!: string;

  costType!: string;

  amount!: number;

  currency?: string;

  description?: string | null;

  expenseDate?: string | null;
}

export class UpsertAgentCommissionProfileDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    agentId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «agente» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «agente» es obligatorio.' }),
    ),
    commissionPercent: numericInput.refine(isProvided, {
      error: 'El campo «porcentaje de comisión» es obligatorio.',
    }),
  });

  agentId!: string;

  commissionPercent!: number;
}

export class CreateBuyerPaymentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    saleClosingId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cierre de venta» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cierre de venta» es obligatorio.',
        }),
    ),
    kind: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «tipo» es obligatorio.' }),
    ),
    amount: numericInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    currency: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    dueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de vencimiento» es obligatorio.',
    }),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  saleClosingId!: string;

  kind!: string;

  amount!: number;

  currency?: string;

  dueDate!: string;

  notes?: string | null;
}

export class UpdateCommissionDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    calculationType: z.enum(['PERCENT', 'FIXED'], {
      error: 'El campo «tipo de cálculo» debe ser PERCENT o FIXED.',
    }),
    percent: optionalValue(numericInput),
    fixedAmount: optionalValue(numericInput),
    reason: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «motivo» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «motivo» es obligatorio.' }),
    ),
  });

  calculationType!: 'PERCENT' | 'FIXED';

  percent?: number | null;

  fixedAmount?: number | null;

  reason!: string;
}
