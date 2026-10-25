import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProduccionStockMovementDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    materialId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «material» debe ser un texto.' })
        .min(1, { error: 'El campo «material» es demasiado corto.' }),
    ),
    movementType: z.enum(['IN', 'OUT', 'ADJUST'], {
      error: 'El campo «tipo de movimiento» no es una opción permitida.',
    }),
    quantity: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «cantidad» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «cantidad» es menor que el mínimo permitido.',
        }),
    ),
    unitCost: z
      .number({ error: 'El campo «costo unitario» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «costo unitario» es menor que el mínimo permitido.',
      })
      .nullish(),
    reference: z
      .string({ error: 'El campo «referencia» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  materialId!: string;

  @ApiProperty({ enum: ['IN', 'OUT', 'ADJUST'] })
  movementType!: 'IN' | 'OUT' | 'ADJUST';

  @ApiProperty({ description: 'IN/OUT: cantidad; ADJUST: stock final deseado' })
  quantity!: number;

  @ApiPropertyOptional()
  unitCost?: number | null;

  @ApiPropertyOptional()
  reference?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
