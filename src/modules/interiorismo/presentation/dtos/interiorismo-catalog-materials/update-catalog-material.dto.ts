import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateInteriorCatalogMaterialDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «nombre» debe ser un texto.' })
          .min(1, { error: 'El campo «nombre» es demasiado corto.' }),
      )
      .nullish(),
    category: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «categoría» debe ser un texto.' })
          .min(1, { error: 'El campo «categoría» es demasiado corto.' }),
      )
      .nullish(),
    brand: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «marca» debe ser un texto.' })
          .min(1, { error: 'El campo «marca» es demasiado corto.' }),
      )
      .nullish(),
    unit: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «unidad» debe ser un texto.' })
          .min(1, { error: 'El campo «unidad» es demasiado corto.' }),
      )
      .nullish(),
    price: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «precio» debe ser un número válido.' }),
      )
      .nullish(),
    stock: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «stock» debe ser un número válido.' }),
      )
      .nullish(),
    currency: z
      .preprocess(
        primitiveText,
        z.enum(['PEN', 'USD', 'EUR'], {
          error: 'El campo «moneda» no es una opción permitida.',
        }),
      )
      .nullish(),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .max(2000, { error: 'El campo «descripción» es demasiado largo.' })
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

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  stock?: number;

  @ApiPropertyOptional()
  technicalSheetUrl?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Si se envía, reemplaza todas las imágenes',
  })
  imageUrls?: string[];

  @ApiPropertyOptional({ enum: ['PEN', 'USD', 'EUR'], default: 'PEN' })
  currency?: string | null;

  @ApiPropertyOptional()
  description?: string | null;
}
