import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para rol del usuario
 */
export class UserRoleDto {
  @ApiProperty({ description: 'ID del rol' })
  id: string;

  @ApiProperty({ description: 'Nombre del rol', example: 'Administrador' })
  name: string;

  @ApiProperty({ description: 'Código del rol', example: 'ADMIN' })
  code: string;
}

/**
 * DTO para la respuesta de usuario (sin contraseña)
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

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

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Estado del usuario',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Roles del usuario',
    type: [UserRoleDto],
    required: false,
  })
  roles?: UserRoleDto[];
}

/**
 * DTO para la respuesta de login
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 3600,
  })
  expiresIn: number;
}

/**
 * DTO para la respuesta de registro
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Usuario registrado exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'Información del usuario creado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
