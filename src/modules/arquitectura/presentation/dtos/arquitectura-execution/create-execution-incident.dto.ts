import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateArquitecturaExecutionIncidentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    severity: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «severity» debe ser un texto.' }),
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
    reportedAt: isoDateInput,
  });

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  severity!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  reportedAt!: string;
}
