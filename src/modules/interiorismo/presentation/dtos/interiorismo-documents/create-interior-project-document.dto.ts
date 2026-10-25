import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

import {
  INTERIOR_DOCUMENT_TYPES,
  type InteriorDocumentType,
} from '../../../domain/repositories/interior-project-document.repository';

const DOC_TYPES = [...INTERIOR_DOCUMENT_TYPES] as InteriorDocumentType[];

export class CreateInteriorProjectDocumentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    projectId: z
      .string({ error: 'El campo «proyecto» no es válido.' })
      .uuid({ error: 'El campo «proyecto» no es válido.' }),
    docType: z.enum(DOC_TYPES, {
      error: 'El campo «docType» no es una opción permitida.',
    }),
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .max(500, { error: 'El campo «título» es demasiado largo.' }),
    ),
    fileUrl: z
      .string({ error: 'El campo «fileUrl» debe ser un texto.' })
      .max(4000, { error: 'El campo «fileUrl» es demasiado largo.' })
      .nullish(),
  });

  @ApiProperty()
  projectId!: string;

  @ApiProperty({ enum: DOC_TYPES })
  docType!: InteriorDocumentType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  fileUrl?: string | null;
}
