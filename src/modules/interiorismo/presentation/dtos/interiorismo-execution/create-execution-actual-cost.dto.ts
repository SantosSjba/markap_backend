import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateInteriorExecutionActualCostDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    costCategory: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «categoría de costo» debe ser un texto.' }),
    ),
    concept: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «concepto» debe ser un texto.' })
        .min(1, { error: 'El campo «concepto» es demasiado corto.' }),
    ),
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «importe» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «importe» es menor que el mínimo permitido.',
        }),
    ),
    occurredAt: isoDateInput,
    catalogMaterialId: z
      .string({ error: 'El campo «catalogMaterialId» no es válido.' })
      .uuid({ error: 'El campo «catalogMaterialId» no es válido.' })
      .nullish(),
  });

  @ApiProperty({ enum: ['LABOR', 'MATERIAL', 'EXPENSE', 'TRANSPORT'] })
  costCategory!: string;

  @ApiProperty()
  concept!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ example: '2026-05-08' })
  occurredAt!: string;

  @ApiPropertyOptional()
  catalogMaterialId?: string | null;
}
