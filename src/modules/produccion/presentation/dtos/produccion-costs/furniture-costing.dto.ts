import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CostingBomUnitCostDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    id: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «id» debe ser un texto.' }),
    ),
    unitCost: z
      .number({ error: 'El campo «costo unitario» debe ser un número válido.' })
      .min(0, {
        error: 'El campo «costo unitario» es menor que el mínimo permitido.',
      })
      .nullish(),
  });

  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  unitCost?: number | null;
}

export class CostingLaborEntryDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    id: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «id» debe ser un texto.' }),
      )
      .nullish(),
    laborRateId: z
      .string({ error: 'El campo «laborRateId» debe ser un texto.' })
      .nullish(),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .min(1, { error: 'El campo «descripción» es demasiado corto.' }),
    ),
    hours: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «horas» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «horas» es menor que el mínimo permitido.',
        }),
    ),
    hourlyRate: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «tarifa por hora» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «tarifa por hora» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
  });

  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  laborRateId?: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  hours!: number;

  @ApiPropertyOptional()
  hourlyRate?: number;
}

export class CostingExtraExpenseDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    id: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «id» debe ser un texto.' }),
      )
      .nullish(),
    catalogItemId: z
      .string({ error: 'El campo «catalogItemId» debe ser un texto.' })
      .nullish(),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .min(1, { error: 'El campo «descripción» es demasiado corto.' }),
    ),
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «importe» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «importe» es menor que el mínimo permitido.',
        }),
    ),
  });

  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  catalogItemId?: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  amount!: number;
}

export class UpdateFurnitureCostingDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    bomUnitCosts: z
      .array(
        z.lazy(() => CostingBomUnitCostDto.schema),
        { error: 'El campo «bomUnitCosts» debe ser una lista.' },
      )
      .nullish(),
    laborEntries: z
      .array(
        z.lazy(() => CostingLaborEntryDto.schema),
        { error: 'El campo «laborEntries» debe ser una lista.' },
      )
      .nullish(),
    extraExpenses: z
      .array(
        z.lazy(() => CostingExtraExpenseDto.schema),
        { error: 'El campo «extraExpenses» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiPropertyOptional({ type: [CostingBomUnitCostDto] })
  bomUnitCosts?: CostingBomUnitCostDto[];

  @ApiPropertyOptional({ type: [CostingLaborEntryDto] })
  laborEntries?: CostingLaborEntryDto[];

  @ApiPropertyOptional({ type: [CostingExtraExpenseDto] })
  extraExpenses?: CostingExtraExpenseDto[];
}

export class CreateCostingSnapshotDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    label: z
      .string({ error: 'El campo «etiqueta» debe ser un texto.' })
      .nullish(),
  });

  @ApiPropertyOptional()
  label?: string | null;
}
