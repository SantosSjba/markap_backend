import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

import {
  ARQUITECTURA_DOCUMENT_TYPES,
  type ArquitecturaDocumentType,
} from '../../../domain/repositories/arquitectura-project-document.repository';
const DOC_TYPES = [
  ...ARQUITECTURA_DOCUMENT_TYPES,
] as ArquitecturaDocumentType[];

export class UpdateArquitecturaProjectDocumentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    docType: z
      .enum(DOC_TYPES, {
        error: 'El campo «docType» no es una opción permitida.',
      })
      .nullish(),
    title: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «título» debe ser un texto.' })
          .max(500, { error: 'El campo «título» es demasiado largo.' }),
      )
      .nullish(),
    fileUrl: z
      .string({ error: 'El campo «fileUrl» debe ser un texto.' })
      .max(4000, { error: 'El campo «fileUrl» es demasiado largo.' })
      .nullish(),
  });

  @ApiPropertyOptional({ enum: DOC_TYPES })
  docType?: ArquitecturaDocumentType;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  fileUrl?: string | null;
}
