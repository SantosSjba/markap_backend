import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateInteriorExecutionTaskDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    phase: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «phase» debe ser un texto.' }),
    ),
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .min(1, { error: 'El campo «título» es demasiado corto.' }),
    ),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    kanbanStatus: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «kanbanStatus» debe ser un texto.' }),
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

  @ApiProperty({ enum: ['DESIGN', 'PURCHASES', 'PRODUCTION', 'INSTALLATION'] })
  phase!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional({ enum: ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'] })
  kanbanStatus?: string;

  @ApiPropertyOptional()
  plannedStart?: string | null;

  @ApiPropertyOptional()
  plannedEnd?: string | null;

  @ApiPropertyOptional()
  progressPct?: number;
}
