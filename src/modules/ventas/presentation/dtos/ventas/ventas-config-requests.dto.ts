import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

/** Categorías del catálogo de bancos y medios de pago */
export const FINANCING_CHANNEL_CATEGORIES = [
  'BANK',
  'PAYMENT_METHOD',
  'OWN_FUNDS',
  'OTHER',
] as const;
export type FinancingChannelCategory =
  (typeof FINANCING_CHANNEL_CATEGORIES)[number];

const categorySchema = z.enum(FINANCING_CHANNEL_CATEGORIES, {
  error: 'La categoría debe ser BANK, PAYMENT_METHOD, OWN_FUNDS u OTHER.',
});

export class CreateFinancingChannelDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    category: z.preprocess(primitiveText, categorySchema),
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «nombre» es obligatorio.' })
        .refine((v) => v.trim().length <= 80, {
          error: 'El nombre admite hasta 80 caracteres.',
        }),
    ),
  });

  category!: FinancingChannelCategory;
  name!: string;
}

export class UpdateFinancingChannelDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    category: optionalValue(categorySchema),
    name: optionalValue(
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .refine((v) => !!v.trim() && v.trim().length <= 80, {
          error: 'El nombre es obligatorio (hasta 80 caracteres).',
        }),
    ),
    isActive: optionalValue(booleanInput),
    sortOrder: optionalValue(numericInput),
  });

  category?: FinancingChannelCategory;
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
}
