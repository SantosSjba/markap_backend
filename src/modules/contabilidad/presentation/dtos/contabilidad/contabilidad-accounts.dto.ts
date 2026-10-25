import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateContabilidadAccountInput,
  UpdateContabilidadAccountInput,
} from '../../../domain/repositories/contabilidad-account.repository';

export class UpdateContabilidadAccountDto implements UpdateContabilidadAccountInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «código» debe ser un texto.' }),
      ),
    ),
    name: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre» debe ser un texto.' }),
      ),
    ),
    accountType: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo de cuenta» debe ser un texto.' }),
      ),
    ),
    isMovement: optionalValue(booleanInput),
    sortOrder: optionalValue(numericInput),
    isActive: optionalValue(booleanInput),
  });

  code?: string;

  name?: string;

  accountType?: string;

  isMovement?: boolean;

  sortOrder?: number;

  isActive?: boolean;
}

export class CreateContabilidadAccountDto implements CreateContabilidadAccountInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    parentId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta padre» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta padre» es obligatorio.',
        }),
    ),
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «nombre» es obligatorio.' }),
    ),
    accountType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de cuenta» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de cuenta» es obligatorio.',
        }),
    ),
    isMovement: booleanInput,
    sortOrder: optionalValue(numericInput),
  });

  parentId!: string;

  code!: string;

  name!: string;

  accountType!: string;

  isMovement!: boolean;

  sortOrder?: number;
}
