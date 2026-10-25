import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

const KINDS = ['ADVANCE', 'INSTALLMENT', 'OTHER'] as const;

export class CreateArquitecturaFinanceScheduleDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    kind: z.preprocess(
      primitiveText,
      z.enum(KINDS, { error: 'El campo «tipo» no es una opción permitida.' }),
    ),
    dueDate: isoDateInput,
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «importe» debe ser un número válido.' })
        .min(0.01, {
          error: 'El campo «importe» es menor que el mínimo permitido.',
        }),
    ),
    concept: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «concepto» debe ser un texto.' })
        .max(2000, { error: 'El campo «concepto» es demasiado largo.' }),
    ),
    sortOrder: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «orden» debe ser un número válido.' }),
      )
      .nullish(),
  });

  @ApiProperty({ enum: KINDS })
  kind!: string;

  @ApiProperty({ example: '2026-05-15' })
  dueDate!: string;

  @ApiProperty({ example: 5000 })
  amount!: number;

  @ApiProperty({ example: 'Cuota 1 — inicio de obra' })
  concept!: string;

  @ApiPropertyOptional({ example: 0 })
  sortOrder?: number;
}
