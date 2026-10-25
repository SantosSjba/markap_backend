import { z } from 'zod';
import { booleanInput } from '../../../../../shared/presentation/validation/input-schemas';

export class ToggleReconciledDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    reconciled: booleanInput,
  });

  reconciled!: boolean;
}
