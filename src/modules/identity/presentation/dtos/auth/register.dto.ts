import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

/**
 * DTO para registro de usuario
 */
export class RegisterDto {
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
  });

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description:
      'Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúscula, minúscula y número)',
    example: 'Password123',
    minLength: 8,
  })
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  lastName: string;
}
