import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
  @ApiProperty({ description: 'ID de la aplicación' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({
    description: 'ID del menú padre (para submenús). Omitir para menú raíz.',
  })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiProperty({ description: 'Etiqueta del menú' })
  @IsString()
  label: string;

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
}
