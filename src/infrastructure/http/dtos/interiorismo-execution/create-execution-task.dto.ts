import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInteriorExecutionTaskDto {
  @ApiProperty({ enum: ['DESIGN', 'PURCHASES', 'PRODUCTION', 'INSTALLATION'] })
  @IsString()
  phase!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'] })
  @IsOptional()
  @IsString()
  kanbanStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedStart?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedEnd?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct?: number;
}
