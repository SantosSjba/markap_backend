import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * DTO para solicitar recuperación de contraseña
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@markap.com',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;
}
