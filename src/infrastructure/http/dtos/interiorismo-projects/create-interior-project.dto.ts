import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateInteriorProjectDto {
  @ApiPropertyOptional({ description: 'Slug aplicación (debe ser interiorismo)' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

  @ApiProperty({ description: 'Código único del proyecto', example: 'INT-PRY-001' })
  @IsString()
  @MaxLength(80)
  code: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Cliente interiorismo (RESIDENTIAL/CORPORATE)' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ enum: PROJECT_TYPES })
  @IsIn([...PROJECT_TYPES])
  projectType: (typeof PROJECT_TYPES)[number];

  @ApiProperty({ enum: PROJECT_STATUSES })
  @IsIn([...PROJECT_STATUSES])
  status: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @ApiPropertyOptional({ example: 'TRUJILLO' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiPropertyOptional({ enum: ['I', 'II', 'III'], description: 'Nivel de intervención' })
  @IsOptional()
  @IsString()
  @IsIn(['I', 'II', 'III'])
  interventionLevel?: string | null;

  @ApiPropertyOptional({ example: '30 DÍAS HÁBILES' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  executionTimeNote?: string | null;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsString()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Utilidad por defecto %', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultUtilityPct?: number | null;

  @ApiPropertyOptional({ description: 'IGV por defecto %', example: 18 })
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

  @ApiPropertyOptional({ description: 'Ambientes / espacios' })
  @IsOptional()
  @IsString()
  environmentsNote?: string | null;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
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

  @ApiPropertyOptional({ description: 'Margen esperado %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedMargin?: number | null;

  @ApiPropertyOptional({ description: 'Avance 0–100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  progressPct?: number | null;
}
