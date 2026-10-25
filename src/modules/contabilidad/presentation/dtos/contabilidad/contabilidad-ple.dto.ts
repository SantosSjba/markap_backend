import { z } from 'zod';
import { isProvided } from '../../../../../shared/presentation/validation/input-schemas';

export class PleBookCodesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    bookCodes: z
      .array(z.string({ error: 'El campo «libros» debe ser un texto.' }), {
        error: 'El campo «libros» debe ser una lista.',
      })
      .refine(isProvided, { error: 'El campo «libros» es obligatorio.' }),
  });

  bookCodes!: string[];
}
