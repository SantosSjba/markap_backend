import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const KINDS = ['ADVANCE', 'INSTALLMENT', 'OTHER'] as const;

export class CreateInteriorFinanceScheduleDto {
  @ApiProperty({ enum: KINDS })
  @IsString()
  @IsIn(KINDS)
  kind!: string;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Cuota 1 — inicio de obra' })
  @IsString()
  @MaxLength(2000)
  concept!: string;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
