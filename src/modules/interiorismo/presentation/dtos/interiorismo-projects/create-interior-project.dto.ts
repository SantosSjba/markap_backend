import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import { INTERIOR_PROJECT_STATUS_CODES } from '../../../domain/constants/interior-project-stages.constants';

const PROJECT_TYPES = [
  'REMODELING',
  'INTERIOR_DESIGN',
  'IMPLEMENTATION',
  'FURNITURE',
] as const;

const PROJECT_STATUSES = [...INTERIOR_PROJECT_STATUS_CODES] as const;

export class CreateInteriorProjectDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    applicationSlug: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
      )
      .nullish(),
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .max(80, { error: 'El campo «código» es demasiado largo.' }),
    ),
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .max(255, { error: 'El campo «nombre» es demasiado largo.' }),
    ),
    clientId: z
      .string({ error: 'El campo «cliente» no es válido.' })
      .uuid({ error: 'El campo «cliente» no es válido.' }),
    projectType: z.enum([...PROJECT_TYPES], {
      error: 'El campo «projectType» no es una opción permitida.',
    }),
    status: z.enum([...PROJECT_STATUSES], {
      error: 'El campo «estado» no es una opción permitida.',
    }),
    addressLine: z
      .string({ error: 'El campo «dirección» debe ser un texto.' })
      .nullish(),
    city: z
      .string({ error: 'El campo «ciudad» debe ser un texto.' })
      .max(120, { error: 'El campo «ciudad» es demasiado largo.' })
      .nullish(),
    interventionLevel: z
      .enum(['I', 'II', 'III'], {
        error: 'El campo «interventionLevel» no es una opción permitida.',
      })
      .nullish(),
    executionTimeNote: z
      .string({ error: 'El campo «executionTimeNote» debe ser un texto.' })
      .max(500, { error: 'El campo «executionTimeNote» es demasiado largo.' })
      .nullish(),
    currency: z
      .preprocess(
        primitiveText,
        z.enum(['PEN', 'USD', 'EUR'], {
          error: 'El campo «moneda» no es una opción permitida.',
        }),
      )
      .nullish(),
    defaultUtilityPct: z
      .number({
        error: 'El campo «defaultUtilityPct» debe ser un número válido.',
      })
      .min(0, {
        error: 'El campo «defaultUtilityPct» es menor que el mínimo permitido.',
      })
      .nullish(),
    defaultIgvPct: z
      .number({ error: 'El campo «defaultIgvPct» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «defaultIgvPct» es menor que el mínimo permitido.',
      })
      .nullish(),
    defaultOverheadPct: z
      .number({
        error: 'El campo «gastos generales %» debe ser un número válido.',
      })
      .min(0, {
        error:
          'El campo «gastos generales %» es menor que el mínimo permitido.',
      })
      .nullish(),
    exchangeRate: z
      .number({ error: 'El campo «tipo de cambio» debe ser un número válido.' })
      .positive({ error: 'El campo «tipo de cambio» debe ser mayor que cero.' })
      .nullish(),
    districtId: z
      .string({ error: 'El campo «distrito» no es válido.' })
      .max(40, { error: 'El campo «distrito» no es válido.' })
      .nullish(),
    areaSqm: z
      .number({ error: 'El campo «área (m²)» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «área (m²)» es menor que el mínimo permitido.',
      })
      .nullish(),
    levelsCount: z
      .number({ error: 'El campo «levelsCount» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «levelsCount» es menor que el mínimo permitido.',
      })
      .nullish(),
    environmentsNote: z
      .string({ error: 'El campo «environmentsNote» debe ser un texto.' })
      .nullish(),
    startDate: isoDateInput.nullish(),
    estimatedEndDate: isoDateInput.nullish(),
    designerAgentId: z
      .string({ error: 'El campo «designerAgentId» no es válido.' })
      .uuid({ error: 'El campo «designerAgentId» no es válido.' })
      .nullish(),
    architectJrAgentId: z
      .string({ error: 'El campo «architectJrAgentId» no es válido.' })
      .uuid({ error: 'El campo «architectJrAgentId» no es válido.' })
      .nullish(),
    architectSrAgentId: z
      .string({ error: 'El campo «architectSrAgentId» no es válido.' })
      .uuid({ error: 'El campo «architectSrAgentId» no es válido.' })
      .nullish(),
    supervisorAgentId: z
      .string({ error: 'El campo «supervisorAgentId» no es válido.' })
      .uuid({ error: 'El campo «supervisorAgentId» no es válido.' })
      .nullish(),
    commercialAgentId: z
      .string({ error: 'El campo «commercialAgentId» no es válido.' })
      .uuid({ error: 'El campo «commercialAgentId» no es válido.' })
      .nullish(),
    estimatedBudget: z
      .number({
        error: 'El campo «presupuesto estimado» debe ser un número válido.',
      })
      .min(0, {
        error:
          'El campo «presupuesto estimado» es menor que el mínimo permitido.',
      })
      .nullish(),
    projectedCost: z
      .number({ error: 'El campo «projectedCost» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «projectedCost» es menor que el mínimo permitido.',
      })
      .nullish(),
    expectedMargin: z
      .number({ error: 'El campo «expectedMargin» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «expectedMargin» es menor que el mínimo permitido.',
      })
      .nullish(),
    progressPct: z
      .number({ error: 'El campo «progressPct» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «progressPct» es menor que el mínimo permitido.',
      })
      .nullish(),
  });

  @ApiPropertyOptional({
    description: 'Slug aplicación (debe ser interiorismo)',
  })
  applicationSlug?: string;

  @ApiProperty({
    description: 'Código único del proyecto',
    example: 'INT-PRY-001',
  })
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Cliente interiorismo (RESIDENTIAL/CORPORATE)' })
  clientId: string;

  @ApiProperty({ enum: PROJECT_TYPES })
  projectType: (typeof PROJECT_TYPES)[number];

  @ApiProperty({ enum: PROJECT_STATUSES })
  status: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional()
  addressLine?: string | null;

  @ApiPropertyOptional({ example: 'TRUJILLO' })
  city?: string | null;

  @ApiPropertyOptional({
    enum: ['I', 'II', 'III'],
    description: 'Nivel de intervención',
  })
  interventionLevel?: string | null;

  @ApiPropertyOptional({ example: '30 DÍAS HÁBILES' })
  executionTimeNote?: string | null;

  @ApiPropertyOptional({ enum: ['PEN', 'USD', 'EUR'], default: 'PEN' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Utilidad por defecto %', example: 20 })
  defaultUtilityPct?: number | null;

  @ApiPropertyOptional({ description: 'IGV por defecto %', example: 18 })
  defaultIgvPct?: number | null;

  @ApiPropertyOptional({
    description: 'Gastos generales por defecto %',
    example: 1,
  })
  defaultOverheadPct?: number | null;

  @ApiPropertyOptional({
    description: 'Tipo de cambio de referencia a soles',
    example: 3.5,
  })
  exchangeRate?: number | null;

  @ApiPropertyOptional({ description: 'Distrito del ubigeo' })
  districtId?: string | null;

  @ApiPropertyOptional()
  areaSqm?: number | null;

  @ApiPropertyOptional()
  levelsCount?: number | null;

  @ApiPropertyOptional({ description: 'Ambientes / espacios' })
  environmentsNote?: string | null;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  startDate?: string | null;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  estimatedEndDate?: string | null;

  @ApiPropertyOptional()
  designerAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Arquitecto Jr' })
  architectJrAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Arquitecto Sr' })
  architectSrAgentId?: string | null;

  @ApiPropertyOptional()
  supervisorAgentId?: string | null;

  @ApiPropertyOptional()
  commercialAgentId?: string | null;

  @ApiPropertyOptional()
  estimatedBudget?: number | null;

  @ApiPropertyOptional()
  projectedCost?: number | null;

  @ApiPropertyOptional({ description: 'Margen esperado %' })
  expectedMargin?: number | null;

  @ApiPropertyOptional({ description: 'Avance 0–100' })
  progressPct?: number | null;
}
