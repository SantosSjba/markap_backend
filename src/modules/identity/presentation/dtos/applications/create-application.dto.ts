import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateApplicationDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «nombre» debe ser un texto.' }),
    ),
    slug: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «slug» debe ser un texto.' }),
    ),
    description: z
      .string({ error: 'El campo «descripción» debe ser un texto.' })
      .nullish(),
    icon: z.string({ error: 'El campo «icon» debe ser un texto.' }).nullish(),
    color: z.string({ error: 'El campo «color» debe ser un texto.' }).nullish(),
    url: z.string({ error: 'El campo «enlace» debe ser un texto.' }).nullish(),
    activeCount: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «activeCount» debe ser un número entero.',
          })
          .int({ error: 'El campo «activeCount» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «activeCount» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    pendingCount: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «pendingCount» debe ser un número entero.',
          })
          .int({ error: 'El campo «pendingCount» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «pendingCount» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    isActive: booleanInput.nullish(),
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

  @ApiProperty({ description: 'Nombre de la aplicación' })
  name: string;

  @ApiProperty({ description: 'Slug único para URL (ej: alquileres, ventas)' })
  slug: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Nombre del ícono' })
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Color del ícono (#hex)' })
  color?: string | null;

  @ApiPropertyOptional({ description: 'URL de la aplicación' })
  url?: string | null;

  @ApiPropertyOptional({ description: 'Cantidad activa' })
  activeCount?: number;

  @ApiPropertyOptional({ description: 'Cantidad pendiente' })
  pendingCount?: number;

  @ApiPropertyOptional({ description: 'Si está activa' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  order?: number;
}
