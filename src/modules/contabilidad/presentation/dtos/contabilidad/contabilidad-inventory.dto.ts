import { z } from 'zod';
import {
  amountInput,
  booleanInput,
  dateOnlyInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  UpdateInventoryItemInput,
} from '../../../domain/repositories/contabilidad-inventory.repository';

export class CreateInventoryMovementDto implements CreateInventoryMovementInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    itemId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «ítem» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «ítem» es obligatorio.' }),
    ),
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    movementType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de movimiento» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de movimiento» es obligatorio.',
        }),
    ),
    movementDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha del movimiento» es obligatorio.',
    }),
    quantity: amountInput.refine(isProvided, {
      error: 'El campo «cantidad» es obligatorio.',
    }),
    unitCost: optionalValue(amountInput),
    offsetType: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({
          error: 'El campo «tipo de contrapartida» debe ser un texto.',
        }),
      ),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  itemId!: string;

  periodId!: string;

  movementType!: string;

  movementDate!: string;

  quantity!: number | string;

  unitCost?: number | string;

  offsetType?: string;

  notes?: string | null;
}

export class UpdateInventoryItemDto implements UpdateInventoryItemInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    description: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «descripción» debe ser un texto.' }),
      ),
    ),
    accountId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «cuenta contable» debe ser un texto.' }),
      ),
    ),
    unit: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «unidad» debe ser un texto.' }),
      ),
    ),
    costMethod: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «método de costeo» debe ser un texto.' }),
      ),
    ),
    isActive: optionalValue(booleanInput),
  });

  description?: string;

  accountId?: string;

  unit?: string;

  costMethod?: string;

  isActive?: boolean;
}

export class CreateInventoryItemDto implements CreateInventoryItemInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «descripción» es obligatorio.',
        }),
    ),
    accountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta contable» es obligatorio.',
        }),
    ),
    unit: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «unidad» debe ser un texto.' }),
      ),
    ),
    costMethod: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «método de costeo» debe ser un texto.' }),
      ),
    ),
  });

  code!: string;

  description!: string;

  accountId!: string;

  unit?: string;

  costMethod?: string;
}
