import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateInteriorExecutionTaskDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    phase: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «phase» debe ser un texto.' }),
      )
      .nullish(),
    title: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «título» debe ser un texto.' })
          .min(1, { error: 'El campo «título» es demasiado corto.' }),
      )
      .nullish(),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    kanbanStatus: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «kanbanStatus» debe ser un texto.' }),
      )
      .nullish(),
    sortOrder: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «orden» debe ser un número válido.' }),
      )
      .nullish(),
    plannedStart: isoDateInput.nullish(),
    plannedEnd: isoDateInput.nullish(),
    progressPct: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «progressPct» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «progressPct» es menor que el mínimo permitido.',
          })
          .max(100, {
            error: 'El campo «progressPct» supera el máximo permitido.',
          }),
      )
      .nullish(),
  });

  @ApiPropertyOptional()
  phase?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  kanbanStatus?: string;

  @ApiPropertyOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  plannedStart?: string | null;

  @ApiPropertyOptional()
  plannedEnd?: string | null;

  @ApiPropertyOptional()
  progressPct?: number;
}
