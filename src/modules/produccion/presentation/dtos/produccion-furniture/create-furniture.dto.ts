import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import { ProduccionFurnitureBomLineDto } from './bom-line.dto';

export class CreateProduccionFurnitureDto {
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
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    widthCm: z
      .number({ error: 'El campo «widthCm» debe ser un número válido.' })
      .nullish(),
    depthCm: z
      .number({ error: 'El campo «depthCm» debe ser un número válido.' })
      .nullish(),
    heightCm: z
      .number({ error: 'El campo «heightCm» debe ser un número válido.' })
      .nullish(),
    referencePrice: z.preprocess(
      numericValue,
      z.number({
        error: 'El campo «referencePrice» debe ser un número válido.',
      }),
    ),
    technicalSheetUrl: z
      .string({ error: 'El campo «technicalSheetUrl» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    isActive: booleanInput.nullish(),
    imageUrls: z
      .array(z.string({ error: 'El campo «imageUrls» debe ser un texto.' }), {
        error: 'El campo «imageUrls» debe ser una lista.',
      })
      .nullish(),
    bomLines: z
      .array(
        z.lazy(() => ProduccionFurnitureBomLineDto.schema),
        { error: 'El campo «bomLines» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'Comedor' })
  category!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  widthCm?: number | null;

  @ApiPropertyOptional()
  depthCm?: number | null;

  @ApiPropertyOptional()
  heightCm?: number | null;

  @ApiProperty()
  referencePrice!: number;

  @ApiPropertyOptional()
  technicalSheetUrl?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [ProduccionFurnitureBomLineDto] })
  bomLines?: ProduccionFurnitureBomLineDto[];
}
