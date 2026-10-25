import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../validation/input-schemas';

import type { ArquitecturaProjectStageInput } from '../../../../modules/arquitectura/domain/repositories/arquitectura-config.repository';
import type { InteriorismoProjectStageInput } from '../../../../modules/interiorismo/domain/repositories/interiorismo-config.repository';
import type { VentasPipelineStageInput } from '../../../../modules/ventas/domain/repositories/ventas-config.repository';

export class InteriorismoProjectStageDto implements InteriorismoProjectStageInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    label: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etiqueta» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «etiqueta» es obligatorio.' }),
    ),
    sortOrder: numericInput.refine(isProvided, {
      error: 'El campo «orden» es obligatorio.',
    }),
    isActive: booleanInput,
  });

  code!: string;

  label!: string;

  sortOrder!: number;

  isActive!: boolean;
}

export class ArquitecturaProjectStageDto implements ArquitecturaProjectStageInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    label: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etiqueta» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «etiqueta» es obligatorio.' }),
    ),
    sortOrder: numericInput.refine(isProvided, {
      error: 'El campo «orden» es obligatorio.',
    }),
    isActive: booleanInput,
  });

  code!: string;

  label!: string;

  sortOrder!: number;

  isActive!: boolean;
}

export class VentasPipelineStageDto implements VentasPipelineStageInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    label: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etiqueta» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «etiqueta» es obligatorio.' }),
    ),
    sortOrder: numericInput.refine(isProvided, {
      error: 'El campo «orden» es obligatorio.',
    }),
    isActive: booleanInput,
  });

  code!: string;

  label!: string;

  sortOrder!: number;

  isActive!: boolean;
}

export class InteriorismoProjectStagesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    stages: z
      .array(
        z.lazy(() => InteriorismoProjectStageDto.schema),
        { error: 'El campo «etapas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «etapas» es obligatorio.' }),
  });

  stages!: InteriorismoProjectStageInput[];
}

export class ArquitecturaProjectStagesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    stages: z
      .array(
        z.lazy(() => ArquitecturaProjectStageDto.schema),
        { error: 'El campo «etapas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «etapas» es obligatorio.' }),
  });

  stages!: ArquitecturaProjectStageInput[];
}

export class ProjectNumberingDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    prefix: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «prefijo» debe ser un texto.' }),
      ),
    ),
    lastNumber: optionalValue(numericInput),
  });

  prefix?: string;

  lastNumber?: number;
}

export class PipelineStagesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    stages: z
      .array(
        z.lazy(() => VentasPipelineStageDto.schema),
        { error: 'El campo «etapas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «etapas» es obligatorio.' }),
  });

  stages!: VentasPipelineStageInput[];
}
