import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  dateOnlyInput,
  optionalBooleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateInteriorExecutionMilestoneDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    title: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «título» debe ser un texto.' })
          .trim()
          .min(1, { error: 'El campo «título» es obligatorio.' })
          .max(200, { error: 'El campo «título» es demasiado largo.' }),
      )
      .optional(),
    plannedDate: dateOnlyInput.optional(),
    completed: optionalBooleanInput,
  });

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional({ example: '2026-11-15' })
  plannedDate?: string;

  @ApiPropertyOptional({
    description: 'true marca el hito como cumplido; false lo reabre',
  })
  completed?: boolean;
}
