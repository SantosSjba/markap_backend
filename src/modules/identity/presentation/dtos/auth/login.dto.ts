import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

/**
 * DTO para login de usuario
 */
export class LoginDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    email: z
      .string({ error: 'El email debe ser válido' })
      .email({ error: 'El email debe ser válido' }),
    password: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «contraseña» debe ser un texto.' })
        .min(1, { error: 'La contraseña es requerida' }),
    ),
  });

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123',
  })
  password: string;
}
