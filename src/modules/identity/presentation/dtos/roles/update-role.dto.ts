import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateRoleDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre» debe ser un texto.' }),
      )
      .nullish(),
    code: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «código» debe ser un texto.' }),
      )
      .nullish(),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    isActive: booleanInput.nullish(),
  });

  @ApiPropertyOptional({ description: 'Nombre del rol' })
  name?: string;

  @ApiPropertyOptional({ description: 'Código único del rol' })
  code?: string;

  @ApiPropertyOptional({ description: 'Descripción del rol' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Si el rol está activo' })
  isActive?: boolean;
}
