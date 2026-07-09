import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const KINDS = ['ADVANCE', 'INSTALLMENT', 'OTHER'] as const;
const STATUSES = ['PENDING', 'PARTIAL', 'PAID', 'WAIVED'] as const;

export class UpdateArquitecturaFinanceScheduleDto {
  @ApiPropertyOptional({ enum: KINDS })
  @IsOptional()
  @IsString()
  @IsIn(KINDS)
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  concept?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  status?: string;
}
