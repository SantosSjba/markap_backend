import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProduccionFurnitureBomLineDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  materialName!: string;

  @ApiProperty({ example: 'm²' })
  @IsString()
  @MinLength(1)
  unit!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class ProduccionFurnitureBomLinesDto {
  @ApiProperty({ type: [ProduccionFurnitureBomLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionFurnitureBomLineDto)
  bomLines!: ProduccionFurnitureBomLineDto[];
}
