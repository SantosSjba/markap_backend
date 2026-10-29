import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import {
  dateOnlyInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateInteriorExecutionMilestoneDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .trim()
        .min(1, { error: 'El campo «título» es obligatorio.' })
        .max(200, { error: 'El campo «título» es demasiado largo.' }),
    ),
    plannedDate: dateOnlyInput,
  });

  @ApiProperty({ example: 'Entrega de mobiliario' })
  title!: string;

  @ApiProperty({ example: '2026-11-15' })
  plannedDate!: string;
}
