import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

/**
 * DTO para solicitar recuperación de contraseña
 */
export class ForgotPasswordDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    email: z
      .string({ error: 'El email debe ser válido' })
      .email({ error: 'El email debe ser válido' }),
  });

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@markap.com',
  })
  email: string;
}
