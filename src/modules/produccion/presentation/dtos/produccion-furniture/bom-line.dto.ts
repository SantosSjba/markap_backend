import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class ProduccionFurnitureBomLineDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    materialName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «materialName» debe ser un texto.' })
        .min(1, { error: 'El campo «materialName» es demasiado corto.' }),
    ),
    unit: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «unidad» debe ser un texto.' })
        .min(1, { error: 'El campo «unidad» es demasiado corto.' }),
    ),
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
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  materialName!: string;

  @ApiProperty({ example: 'm²' })
  unit!: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  unitCost?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class ProduccionFurnitureBomLinesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    bomLines: z.array(
      z.lazy(() => ProduccionFurnitureBomLineDto.schema),
      { error: 'El campo «bomLines» debe ser una lista.' },
    ),
  });

  @ApiProperty({ type: [ProduccionFurnitureBomLineDto] })
  bomLines!: ProduccionFurnitureBomLineDto[];
}
