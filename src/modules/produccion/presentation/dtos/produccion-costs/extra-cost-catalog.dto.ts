import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProduccionExtraCostCatalogDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .min(1, { error: 'El campo «nombre» es demasiado corto.' }),
    ),
    defaultAmount: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «defaultAmount» debe ser un número válido.',
        })
        .min(0, {
          error: 'El campo «defaultAmount» es menor que el mínimo permitido.',
        }),
    ),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    isActive: booleanInput.nullish(),
  });

  @ApiProperty()
  name!: string;

  @ApiProperty()
  defaultAmount!: number;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class UpdateProduccionExtraCostCatalogDto {
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
    defaultAmount: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «defaultAmount» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «defaultAmount» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    isActive: booleanInput.nullish(),
  });

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  defaultAmount?: number;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean;
}
