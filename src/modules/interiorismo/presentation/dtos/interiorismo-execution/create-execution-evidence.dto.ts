import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateInteriorExecutionEvidenceDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    taskId: z
      .string({ error: 'El campo «taskId» no es válido.' })
      .uuid({ error: 'El campo «taskId» no es válido.' })
      .nullish(),
    kind: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «tipo» debe ser un texto.' }),
    ),
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .min(1, { error: 'El campo «título» es demasiado corto.' }),
    ),
    fileUrl: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «fileUrl» debe ser un texto.' })
        .min(1, { error: 'El campo «fileUrl» es demasiado corto.' }),
    ),
    capturedAt: isoDateInput,
  });

  @ApiPropertyOptional()
  taskId?: string | null;

  @ApiProperty({ enum: ['PHOTO', 'DOCUMENT', 'OTHER'] })
  kind!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'URL del archivo o imagen' })
  fileUrl!: string;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  capturedAt!: string;
}
