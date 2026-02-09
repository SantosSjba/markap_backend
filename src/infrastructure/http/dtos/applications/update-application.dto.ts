import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateApplicationDto {
  @ApiPropertyOptional({ description: 'Nombre de la aplicación' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Slug único para URL' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Nombre del ícono' })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Color del ícono' })
  @IsOptional()
  @IsString()
  color?: string | null;

  @ApiPropertyOptional({ description: 'URL de la aplicación' })
  @IsOptional()
  @IsString()
  url?: string | null;

  @ApiPropertyOptional({ description: 'Cantidad activa' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  activeCount?: number;

  @ApiPropertyOptional({ description: 'Cantidad pendiente' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pendingCount?: number;

  @ApiPropertyOptional({ description: 'Si está activa' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
