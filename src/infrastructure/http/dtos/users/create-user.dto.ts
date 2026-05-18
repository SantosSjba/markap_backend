import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsUUID,
  IsOptional,
} from 'class-validator';

/**
 * Alta de usuario desde administración (Settings).
 * Los roles se asignan después vía POST /users/:userId/roles/:roleId
 * o opcionalmente con roleIds en el mismo request.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede exceder 50 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'IDs de roles a asignar al crear (opcional)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
