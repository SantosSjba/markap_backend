import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

/** Body de `PATCH /users/:id` */
export class UpdateUserDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    firstName: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «nombre» debe ser un texto.' })
          .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
          .max(50, { error: 'El nombre no puede exceder 50 caracteres' }),
      )
      .nullish(),
    lastName: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «apellido» debe ser un texto.' })
          .min(2, { error: 'El apellido debe tener al menos 2 caracteres' })
          .max(50, { error: 'El apellido no puede exceder 50 caracteres' }),
      )
      .nullish(),
    email: z
      .string({ error: 'El email debe ser válido' })
      .email({ error: 'El email debe ser válido' })
      .nullish(),
  });

  @ApiPropertyOptional({ example: 'Juan' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'nuevo@ejemplo.com' })
  email?: string;
}
