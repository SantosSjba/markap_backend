import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { numericValue } from '../../../../../shared/presentation/validation/input-schemas';

export class PatchArquitecturaExecutionProgressDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    progressPct: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «progressPct» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «progressPct» es menor que el mínimo permitido.',
        })
        .max(100, {
          error: 'El campo «progressPct» supera el máximo permitido.',
        }),
    ),
  });

  @ApiProperty({ description: 'Avance global del proyecto 0–100' })
  progressPct!: number;
}
