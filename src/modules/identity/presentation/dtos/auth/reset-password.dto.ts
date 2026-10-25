import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

/**
 * DTO para restablecer contraseña con código
 */
export class ResetPasswordDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    email: z
      .string({ error: 'El email debe ser válido' })
      .email({ error: 'El email debe ser válido' }),
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .min(6, { error: 'El código debe tener exactamente 6 dígitos' })
        .max(6, { error: 'El código debe tener exactamente 6 dígitos' })
        .regex(/^\d{6}$/, { error: 'El código debe contener solo números' }),
    ),
    newPassword: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nueva contraseña» debe ser un texto.' })
        .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
        .max(50, { error: 'El campo «nueva contraseña» es demasiado largo.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          error:
            'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
        }),
    ),
  });

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@markap.com',
  })
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos recibido por correo',
    example: '123456',
  })
  code: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'NuevaPassword123',
  })
  newPassword: string;
}
