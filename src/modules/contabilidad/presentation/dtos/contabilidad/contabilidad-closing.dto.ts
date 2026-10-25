import { z } from 'zod';
import {
  booleanInput,
  optionalValue,
} from '../../../../../shared/presentation/validation/input-schemas';

export class ClosePeriodDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    postRegularization: optionalValue(booleanInput),
  });

  postRegularization?: boolean;
}
