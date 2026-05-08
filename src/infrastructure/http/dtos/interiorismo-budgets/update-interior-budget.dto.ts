import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInteriorBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultIgvPct?: number;

  @ApiPropertyOptional({ description: 'Reemplaza la estructura completa si se envía', type: 'array' })
  @IsOptional()
  @IsArray()
  levels?: unknown[];
}
