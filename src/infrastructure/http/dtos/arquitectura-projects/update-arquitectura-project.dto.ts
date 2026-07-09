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
  ARQUITECTURA_PROJECT_STATUS_CODES,
  ARQUITECTURA_PROJECT_TYPES,
} from '@domain/constants/arquitectura-project-stages.constants';

const PROJECT_STATUSES = [...ARQUITECTURA_PROJECT_STATUS_CODES] as const;

export class UpdateArquitecturaProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: ARQUITECTURA_PROJECT_TYPES })
  @IsOptional()
  @IsIn([...ARQUITECTURA_PROJECT_TYPES])
  projectType?: (typeof ARQUITECTURA_PROJECT_TYPES)[number];

  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn([...PROJECT_STATUSES])
  status?: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @ApiPropertyOptional({ example: 'TRUJILLO' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiPropertyOptional({ enum: ['I', 'II', 'III'] })
  @IsOptional()
  @IsString()
  @IsIn(['I', 'II', 'III'])
  interventionLevel?: string | null;

  @ApiPropertyOptional({ example: '30 DÍAS HÁBILES' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  executionTimeNote?: string | null;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'] })
  @IsOptional()
  @IsString()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultUtilityPct?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultIgvPct?: number | null;

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

  @ApiPropertyOptional({ description: 'Arquitecto Jr' })
  @IsOptional()
  @IsUUID()
  architectJrAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Arquitecto Sr' })
  @IsOptional()
  @IsUUID()
  architectSrAgentId?: string | null;

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
