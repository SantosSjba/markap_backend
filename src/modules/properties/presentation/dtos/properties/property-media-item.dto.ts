import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

export class PropertyMediaItemDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    url: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «enlace» debe ser un texto.' })
        .max(2048, { error: 'El campo «enlace» es demasiado largo.' }),
    ),
    kind: z.enum(['photo', 'plan'], {
      error: 'El campo «tipo» no es una opción permitida.',
    }),
    archivoId: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «archivo» debe ser un texto.' })
          .max(64, { error: 'El campo «archivo» es demasiado largo.' }),
      )
      .nullish(),
  });

  @ApiProperty({ example: 'https://ejemplo.com/foto.jpg' })
  url: string;

  @ApiProperty({ enum: ['photo', 'plan'] })
  kind: 'photo' | 'plan';

  @ApiPropertyOptional({
    description: 'ID GenArchivo cuando el media se subió a MinIO',
  })
  archivoId?: string;
}
