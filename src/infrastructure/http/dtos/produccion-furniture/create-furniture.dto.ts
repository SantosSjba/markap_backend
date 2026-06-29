import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProduccionFurnitureBomLineDto } from './bom-line.dto';

export class CreateProduccionFurnitureDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Comedor' })
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  widthCm?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depthCm?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heightCm?: number | null;

  @ApiProperty()
  @IsNumber()
  referencePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalSheetUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [ProduccionFurnitureBomLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionFurnitureBomLineDto)
  bomLines?: ProduccionFurnitureBomLineDto[];
}
