import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateMenuDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    applicationId: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
    ),
    parentId: z
      .string({ error: 'El campo «cuenta padre» debe ser un texto.' })
      .nullish(),
    label: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «etiqueta» debe ser un texto.' }),
    ),
    icon: z.string({ error: 'El campo «icon» debe ser un texto.' }).nullish(),
    path: z.string({ error: 'El campo «path» debe ser un texto.' }).nullish(),
    order: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «order» debe ser un número entero.' })
          .int({ error: 'El campo «order» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «order» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
  });

  @ApiProperty({ description: 'ID de la aplicación' })
  applicationId: string;

  @ApiPropertyOptional({
    description: 'ID del menú padre (para submenús). Omitir para menú raíz.',
  })
  parentId?: string | null;

  @ApiProperty({ description: 'Etiqueta del menú' })
  label: string;

  @ApiPropertyOptional({ description: 'Nombre del ícono' })
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Ruta de navegación' })
  path?: string | null;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  order?: number;
}
