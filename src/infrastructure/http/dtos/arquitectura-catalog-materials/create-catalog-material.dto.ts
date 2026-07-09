import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateArquitecturaCatalogMaterialDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  brand!: string;

  @ApiProperty({ example: 'm²' })
  @IsString()
  @MinLength(1)
  unit!: string;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ description: 'URL de ficha técnica (PDF o página)' })
  @IsOptional()
  @IsString()
  technicalSheetUrl?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'URLs de imágenes en orden' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
