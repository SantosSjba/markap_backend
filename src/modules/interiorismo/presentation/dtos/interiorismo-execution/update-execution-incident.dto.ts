import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateInteriorExecutionIncidentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    status: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «estado» debe ser un texto.' }),
      )
      .nullish(),
    severity: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «severity» debe ser un texto.' }),
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
    closedAt: isoDateInput.nullish(),
  });

  @ApiPropertyOptional({ enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'] })
  status?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  severity?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  closedAt?: string | null;
}
