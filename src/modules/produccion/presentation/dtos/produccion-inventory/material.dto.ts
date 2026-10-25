import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProduccionMaterialDto {
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
    unit: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «unidad» debe ser un texto.' })
        .min(1, { error: 'El campo «unidad» es demasiado corto.' }),
    ),
    unitCost: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «costo unitario» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «costo unitario» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    minStockQty: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «stock mínimo» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «stock mínimo» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    isActive: booleanInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ example: 'und' })
  unit!: string;

  @ApiPropertyOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  minStockQty?: number;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class UpdateProduccionMaterialDto {
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
    unit: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «unidad» debe ser un texto.' })
          .min(1, { error: 'El campo «unidad» es demasiado corto.' }),
      )
      .nullish(),
    unitCost: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «costo unitario» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «costo unitario» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    minStockQty: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «stock mínimo» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «stock mínimo» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    isActive: booleanInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  minStockQty?: number;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  notes?: string | null;
}
