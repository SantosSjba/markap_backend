import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProduccionLaborRateDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .min(1, { error: 'El campo «nombre» es demasiado corto.' }),
    ),
    stage: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etapa» debe ser un texto.' })
        .min(1, { error: 'El campo «etapa» es demasiado corto.' }),
    ),
    hourlyRate: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «tarifa por hora» debe ser un número válido.',
        })
        .min(0, {
          error: 'El campo «tarifa por hora» es menor que el mínimo permitido.',
        }),
    ),
    isActive: booleanInput.nullish(),
  });

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'Corte' })
  stage!: string;

  @ApiProperty()
  hourlyRate!: number;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class UpdateProduccionLaborRateDto {
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
    stage: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «etapa» debe ser un texto.' })
          .min(1, { error: 'El campo «etapa» es demasiado corto.' }),
      )
      .nullish(),
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
    isActive: booleanInput.nullish(),
  });

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  stage?: string;

  @ApiPropertyOptional()
  hourlyRate?: number;

  @ApiPropertyOptional()
  isActive?: boolean;
}
