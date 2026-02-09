import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nombre del rol' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Código único del rol (ej: ADMIN, MANAGER)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Descripción del rol' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Si el rol está activo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
