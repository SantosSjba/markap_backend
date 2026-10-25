import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

export class LocationCustomDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    country: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «país» debe ser un texto.' })
        .max(120, { error: 'El campo «país» es demasiado largo.' }),
    ),
    department: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «departamento» debe ser un texto.' })
        .max(120, { error: 'El campo «departamento» es demasiado largo.' }),
    ),
    province: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «provincia» debe ser un texto.' })
        .max(120, { error: 'El campo «provincia» es demasiado largo.' }),
    ),
    district: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «distrito» debe ser un texto.' })
        .max(120, { error: 'El campo «distrito» es demasiado largo.' }),
    ),
  });

  @ApiProperty({ example: 'España' })
  country: string;

  @ApiProperty({ example: 'Comunidad de Madrid' })
  department: string;

  @ApiProperty({ example: 'Madrid' })
  province: string;

  @ApiProperty({ example: 'Centro' })
  district: string;
}
