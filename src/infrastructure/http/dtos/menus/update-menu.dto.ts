import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMenuDto {
  @ApiPropertyOptional({ description: 'ID del menú padre' })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Etiqueta del menú' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Nombre del ícono' })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Ruta de navegación' })
  @IsOptional()
  @IsString()
  path?: string | null;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Si el menú está activo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
