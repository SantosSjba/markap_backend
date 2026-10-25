import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

/**
 * Alta de usuario desde administración (Settings).
 * Los roles se asignan después vía POST /users/:userId/roles/:roleId
 * o opcionalmente con roleIds en el mismo request.
 */
export class CreateUserDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    email: z
      .string({ error: 'El email debe ser válido' })
      .email({ error: 'El email debe ser válido' }),
    password: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «contraseña» debe ser un texto.' })
        .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
        .max(50, { error: 'La contraseña no puede exceder 50 caracteres' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          error:
            'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
        }),
    ),
    firstName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
        .max(50, { error: 'El nombre no puede exceder 50 caracteres' }),
    ),
    lastName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «apellido» debe ser un texto.' })
        .min(2, { error: 'El apellido debe tener al menos 2 caracteres' })
        .max(50, { error: 'El apellido no puede exceder 50 caracteres' }),
    ),
    roleIds: z
      .array(
        z
          .string({ error: 'El campo «roles» no es válido.' })
          .uuid({ version: 'v4', error: 'El campo «roles» no es válido.' }),
        { error: 'El campo «roles» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiProperty({ example: 'usuario@ejemplo.com' })
  email: string;

  @ApiProperty({ minLength: 8 })
  password: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'IDs de roles a asignar al crear (opcional)',
    type: [String],
  })
  roleIds?: string[];
}
