import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

const KINDS = ['ADVANCE', 'INSTALLMENT', 'OTHER'] as const;
const STATUSES = ['PENDING', 'PARTIAL', 'PAID', 'WAIVED'] as const;

export class UpdateArquitecturaFinanceScheduleDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    kind: z
      .preprocess(
        primitiveText,
        z.enum(KINDS, { error: 'El campo «tipo» no es una opción permitida.' }),
      )
      .nullish(),
    dueDate: isoDateInput.nullish(),
    amount: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «importe» debe ser un número válido.' })
          .min(0.01, {
            error: 'El campo «importe» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    concept: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «concepto» debe ser un texto.' })
          .max(2000, { error: 'El campo «concepto» es demasiado largo.' }),
      )
      .nullish(),
    sortOrder: z
      .preprocess(
        numericValue,
        z.number({ error: 'El campo «orden» debe ser un número válido.' }),
      )
      .nullish(),
    status: z
      .preprocess(
        primitiveText,
        z.enum(STATUSES, {
          error: 'El campo «estado» no es una opción permitida.',
        }),
      )
      .nullish(),
  });

  @ApiPropertyOptional({ enum: KINDS })
  kind?: string;

  @ApiPropertyOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  amount?: number;

  @ApiPropertyOptional()
  concept?: string;

  @ApiPropertyOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: STATUSES })
  status?: string;
}
