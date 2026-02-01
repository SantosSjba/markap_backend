import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de una aplicación
 */
export class ApplicationResponseDto {
  @ApiProperty({
    description: 'ID único de la aplicación',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la aplicación',
    example: 'MARKAP Alquileres Inmobiliarios',
  })
  name: string;

  @ApiProperty({
    description: 'Slug único de la aplicación',
    example: 'alquileres',
  })
  slug: string;

  @ApiProperty({
    description: 'Descripción de la aplicación',
    example: 'Gestión de propiedades en alquiler, contratos y cobranzas',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Nombre del ícono',
    example: 'key',
    nullable: true,
  })
  icon: string | null;

  @ApiProperty({
    description: 'Color del ícono/card',
    example: '#0BB0BE',
    nullable: true,
  })
  color: string | null;

  @ApiProperty({
    description: 'URL de la aplicación',
    example: '/alquileres',
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    description: 'Cantidad de items activos',
    example: 45,
  })
  activeCount: number;

  @ApiProperty({
    description: 'Cantidad de items pendientes',
    example: 8,
  })
  pendingCount: number;

  @ApiProperty({
    description: 'Orden de visualización',
    example: 1,
  })
  order: number;
}

/**
 * DTO para la lista de aplicaciones del usuario
 */
export class UserApplicationsResponseDto {
  @ApiProperty({
    description: 'Lista de aplicaciones del usuario',
    type: [ApplicationResponseDto],
  })
  applications: ApplicationResponseDto[];
}
