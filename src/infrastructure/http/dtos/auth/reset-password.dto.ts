import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Length,
  Matches,
} from 'class-validator';

/**
 * DTO para restablecer contraseña con código
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@markap.com',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos recibido por correo',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código debe contener solo números' })
  code: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'NuevaPassword123',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;
}
