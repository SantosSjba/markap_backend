import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type { UpsertCpeProviderConfigInput } from '../../../domain/repositories/contabilidad-cpe.repository';
import type { UpsertSolCredentialsInput } from '../../../domain/repositories/contabilidad-sol.repository';

export class UpsertSolCredentialsDto implements UpsertSolCredentialsInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    solUser: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «solUser» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «solUser» es obligatorio.' }),
    ),
    solPassword: optionalValue(
      z.string({ error: 'El campo «solPassword» debe ser un texto.' }),
    ),
    useSandbox: optionalValue(booleanInput),
    isActive: optionalValue(booleanInput),
  });

  solUser!: string;

  solPassword?: string | null;

  useSandbox?: boolean;

  isActive?: boolean;
}

export class UpsertCpeProviderConfigDto implements UpsertCpeProviderConfigInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    providerCode: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «providerCode» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «providerCode» es obligatorio.',
        }),
    ),
    apiBaseUrl: optionalValue(
      z.string({ error: 'El campo «apiBaseUrl» debe ser un texto.' }),
    ),
    apiToken: optionalValue(
      z.string({ error: 'El campo «apiToken» debe ser un texto.' }),
    ),
    certificateHint: optionalValue(
      z.string({ error: 'El campo «certificateHint» debe ser un texto.' }),
    ),
    useSandbox: optionalValue(booleanInput),
    isActive: optionalValue(booleanInput),
  });

  providerCode!: string;

  apiBaseUrl?: string | null;

  apiToken?: string | null;

  certificateHint?: string | null;

  useSandbox?: boolean;

  isActive?: boolean;
}
