import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsIn,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';

import {
  INTERIOR_PROJECT_STATUS_CODES,
} from '@domain/constants/interior-project-stages.constants';

const PROJECT_TYPES = [
  'REMODELING',
  'INTERIOR_DESIGN',
  'IMPLEMENTATION',
  'FURNITURE',
] as const;

const PROJECT_STATUSES = [...INTERIOR_PROJECT_STATUS_CODES] as const;

export class UpdateInteriorProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: PROJECT_TYPES })
  @IsOptional()
  @IsIn([...PROJECT_TYPES])
  projectType?: (typeof PROJECT_TYPES)[number];

  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn([...PROJECT_STATUSES])
  status?: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  levelsCount?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environmentsNote?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  designerAgentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  architectAgentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supervisorAgentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  commercialAgentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedBudget?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  projectedCost?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedMargin?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  progressPct?: number | null;
}
