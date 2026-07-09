import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateArquitecturaExecutionActualCostDto {
  @ApiProperty({ enum: ['LABOR', 'MATERIAL', 'EXPENSE', 'TRANSPORT'] })
  @IsString()
  costCategory!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  concept!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: '2026-05-08' })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  catalogMaterialId?: string | null;
}
