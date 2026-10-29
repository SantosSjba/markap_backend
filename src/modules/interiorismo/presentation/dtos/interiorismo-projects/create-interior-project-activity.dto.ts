import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';
import {
  INTERIOR_MANUAL_ACTIVITY_TYPES,
  type InteriorManualActivityType,
} from '../../../domain/repositories/interior-project.repository';

export class CreateInteriorProjectActivityDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    activityType: z.enum(INTERIOR_MANUAL_ACTIVITY_TYPES, {
      error: 'El campo «tipo» no es válido.',
    }),
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .trim()
        .min(1, { error: 'El campo «título» es obligatorio.' })
        .max(200, { error: 'El campo «título» admite hasta 200 caracteres.' }),
    ),
    description: z
      .string({ error: 'El campo «detalle» debe ser un texto.' })
      .max(4000, { error: 'El campo «detalle» admite hasta 4000 caracteres.' })
      .nullish(),
    occurredAt: isoDateInput,
  });

  @ApiProperty({ enum: INTERIOR_MANUAL_ACTIVITY_TYPES })
  activityType!: InteriorManualActivityType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ example: '2026-10-29T15:00:00.000Z' })
  occurredAt!: string;
}
