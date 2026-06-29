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

export class CostingBomUnitCostDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number | null;
}

export class CostingLaborEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  laborRateId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  hours!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}

export class CostingExtraExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  catalogItemId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;
}

export class UpdateFurnitureCostingDto {
  @ApiPropertyOptional({ type: [CostingBomUnitCostDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostingBomUnitCostDto)
  bomUnitCosts?: CostingBomUnitCostDto[];

  @ApiPropertyOptional({ type: [CostingLaborEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostingLaborEntryDto)
  laborEntries?: CostingLaborEntryDto[];

  @ApiPropertyOptional({ type: [CostingExtraExpenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostingExtraExpenseDto)
  extraExpenses?: CostingExtraExpenseDto[];
}

export class CreateCostingSnapshotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string | null;
}
