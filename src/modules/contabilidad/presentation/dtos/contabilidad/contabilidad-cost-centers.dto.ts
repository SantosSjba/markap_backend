import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '../../../domain/repositories/contabilidad-period.repository';

export class UpdateContabilidadCostCenterDto implements UpdateContabilidadCostCenterInput {
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
    parentId: optionalValue(
      z.string({ error: 'El campo «cuenta padre» debe ser un texto.' }),
    ),
    isActive: optionalValue(booleanInput),
  });

  code?: string;

  name?: string;

  parentId?: string | null;

  isActive?: boolean;
}

export class CreateContabilidadCostCenterDto implements CreateContabilidadCostCenterInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
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
    parentId: optionalValue(
      z.string({ error: 'El campo «cuenta padre» debe ser un texto.' }),
    ),
  });

  code!: string;

  name!: string;

  parentId?: string | null;
}
