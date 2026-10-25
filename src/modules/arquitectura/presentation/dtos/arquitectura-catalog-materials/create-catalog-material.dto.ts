import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateArquitecturaCatalogMaterialDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .min(1, { error: 'El campo «código» es demasiado corto.' }),
    ),
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .min(1, { error: 'El campo «nombre» es demasiado corto.' }),
    ),
    category: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «categoría» debe ser un texto.' })
        .min(1, { error: 'El campo «categoría» es demasiado corto.' }),
    ),
    brand: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «marca» debe ser un texto.' })
        .min(1, { error: 'El campo «marca» es demasiado corto.' }),
    ),
    unit: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «unidad» debe ser un texto.' })
        .min(1, { error: 'El campo «unidad» es demasiado corto.' }),
    ),
    price: z.preprocess(
      numericValue,
      z.number({ error: 'El campo «precio» debe ser un número válido.' }),
    ),
    stock: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «stock» debe ser un número válido.' }),
      )
      .nullish(),
    technicalSheetUrl: z
      .string({ error: 'El campo «technicalSheetUrl» debe ser un texto.' })
      .nullish(),
    imageUrls: z
      .array(z.string({ error: 'El campo «imageUrls» debe ser un texto.' }), {
        error: 'El campo «imageUrls» debe ser una lista.',
      })
      .nullish(),
  });

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  brand!: string;

  @ApiProperty({ example: 'm²' })
  unit!: string;

  @ApiProperty()
  price!: number;

  @ApiPropertyOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'URL de ficha técnica (PDF o página)' })
  technicalSheetUrl?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'URLs de imágenes en orden',
  })
  imageUrls?: string[];
}
