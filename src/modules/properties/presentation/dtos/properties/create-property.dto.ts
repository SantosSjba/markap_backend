import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import { UBIGEO_OTHER_DISTRICT_ID } from '../../../../../shared/constants/ubigeo-other.constants';
import { LocationCustomDto } from '../../../../crm/presentation/dtos/clients/location-custom.dto';
import { PropertyMediaItemDto } from './property-media-item.dto';

export class CreatePropertyDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z
    .strictObject({
      applicationId: z
        .preprocess(
          primitiveText,
          z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
        )
        .nullish(),
      applicationSlug: z
        .preprocess(
          primitiveText,
          z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
        )
        .nullish(),
      code: z.preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «código» debe ser un texto.' })
          .max(120, { error: 'El campo «código» es demasiado largo.' }),
      ),
      propertyTypeId: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo de propiedad» debe ser un texto.' }),
      ),
      addressLine: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «dirección» debe ser un texto.' }),
      ),
      districtId: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «distrito» debe ser un texto.' }),
      ),
      locationCustom: z.unknown().optional(),
      description: z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .nullish(),
      area: z
        .preprocess(
          numericValue,
          z
            .number({ error: 'El campo «área» debe ser un número válido.' })
            .min(0, {
              error: 'El campo «área» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      bedrooms: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «dormitorios» debe ser un número válido.',
            })
            .min(0, {
              error: 'El campo «dormitorios» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      bathrooms: z
        .preprocess(
          numericValue,
          z
            .number({ error: 'El campo «baños» debe ser un número válido.' })
            .min(0, {
              error: 'El campo «baños» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      ageYears: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «antigüedad (años)» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «antigüedad (años)» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      floorLevel: z
        .string({ error: 'El campo «piso» debe ser un texto.' })
        .nullish(),
      parkingSpaces: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «estacionamientos» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «estacionamientos» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      partida1: z
        .string({ error: 'El campo «partida1» debe ser un texto.' })
        .max(100, { error: 'El campo «partida1» es demasiado largo.' })
        .nullish(),
      partida2: z
        .string({ error: 'El campo «partida2» debe ser un texto.' })
        .max(100, { error: 'El campo «partida2» es demasiado largo.' })
        .nullish(),
      partida3: z
        .string({ error: 'El campo «partida3» debe ser un texto.' })
        .max(100, { error: 'El campo «partida3» es demasiado largo.' })
        .nullish(),
      ownerId: z.preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «propietario» debe ser un texto.' })
          .uuid({ error: 'El campo «propietario» no es válido.' }),
      ),
      ownerClientIds: z
        .array(
          z.string({ error: 'El campo «propietarios» no es válido.' }).uuid({
            version: 'v4',
            error: 'El campo «propietarios» no es válido.',
          }),
          { error: 'El campo «propietarios» debe ser una lista.' },
        )
        .nullish(),
      monthlyRent: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «renta mensual» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «renta mensual» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      maintenanceAmount: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «mantenimiento» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «mantenimiento» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      depositMonths: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «meses de garantía» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «meses de garantía» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      salePrice: z
        .preprocess(
          numericValue,
          z
            .number({
              error: 'El campo «precio de venta» debe ser un número válido.',
            })
            .min(0, {
              error:
                'El campo «precio de venta» es menor que el mínimo permitido.',
            }),
        )
        .nullish(),
      rentCurrency: z
        .preprocess(
          primitiveText,
          z
            .string({
              error: 'El campo «moneda del alquiler» debe ser un texto.',
            })
            .max(10, {
              error: 'El campo «moneda del alquiler» es demasiado largo.',
            }),
        )
        .nullish(),
      saleCurrency: z
        .preprocess(
          primitiveText,
          z
            .string({ error: 'El campo «saleCurrency» debe ser un texto.' })
            .max(10, { error: 'El campo «saleCurrency» es demasiado largo.' }),
        )
        .nullish(),
      projectName: z
        .string({ error: 'El campo «projectName» debe ser un texto.' })
        .max(200, { error: 'El campo «projectName» es demasiado largo.' })
        .nullish(),
      mediaItems: z
        .array(
          z.lazy(() => PropertyMediaItemDto.schema),
          { error: 'El campo «mediaItems» debe ser una lista.' },
        )
        .nullish(),
      listingStatus: z
        .enum(
          [
            'AVAILABLE',
            'RESERVED',
            'SOLD',
            'RENTED',
            'EXPIRING',
            'MAINTENANCE',
          ],
          {
            error:
              'El campo «estado de la propiedad» no es una opción permitida.',
          },
        )
        .nullish(),
    })
    .superRefine((value, ctx) => {
      if (value.districtId === UBIGEO_OTHER_DISTRICT_ID) {
        const result = z
          .lazy(() => LocationCustomDto.schema)
          .safeParse(value['locationCustom']);
        if (!result.success) {
          for (const issue of result.error.issues)
            ctx.addIssue({ ...issue, path: ['locationCustom', ...issue.path] });
        } else {
          value['locationCustom'] = result.data;
        }
      }
    });

  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Slug de la aplicación (ej: alquileres)',
  })
  applicationSlug?: string;

  @ApiProperty({ description: 'Código de la propiedad (ej: PROP-001)' })
  code: string;

  @ApiProperty({ description: 'ID del tipo de propiedad' })
  propertyTypeId: string;

  @ApiProperty({ description: 'Dirección completa' })
  addressLine: string;

  @ApiProperty({ description: 'ID del distrito (ubigeo)' })
  districtId: string;

  @ApiPropertyOptional({
    description:
      'Ubicación libre cuando distrito = Otros (país, departamento, provincia, distrito)',
  })
  locationCustom?: LocationCustomDto;

  @ApiPropertyOptional({ description: 'Descripción de la propiedad' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Área en m²' })
  area?: number | null;

  @ApiPropertyOptional({ description: 'Número de habitaciones' })
  bedrooms?: number | null;

  @ApiPropertyOptional({ description: 'Número de baños' })
  bathrooms?: number | null;

  @ApiPropertyOptional({ description: 'Antigüedad en años' })
  ageYears?: number | null;

  @ApiPropertyOptional({ description: 'Piso o nivel' })
  floorLevel?: string | null;

  @ApiPropertyOptional({ description: 'Número de estacionamientos' })
  parkingSpaces?: number | null;

  @ApiPropertyOptional({
    description: 'Número de partida 1 (máx. 3 por propiedad)',
  })
  partida1?: string | null;

  @ApiPropertyOptional({ description: 'Número de partida 2' })
  partida2?: string | null;

  @ApiPropertyOptional({ description: 'Número de partida 3' })
  partida3?: string | null;

  @ApiProperty({
    description: 'ID del propietario principal (cliente tipo OWNER)',
  })
  ownerId: string;

  @ApiPropertyOptional({
    description:
      'IDs de copropietarios / propietarios adicionales (incluye el principal)',
    type: [String],
  })
  ownerClientIds?: string[];

  @ApiPropertyOptional({ description: 'Alquiler mensual (en rentCurrency)' })
  monthlyRent?: number | null;

  @ApiPropertyOptional({
    description:
      'Moneda del alquiler y mantenimiento (código catálogo, ej. PEN, USD)',
    default: 'PEN',
  })
  rentCurrency?: string;

  @ApiPropertyOptional({ description: 'Mantenimiento (en rentCurrency)' })
  maintenanceAmount?: number | null;

  @ApiPropertyOptional({ description: 'Garantía en meses' })
  depositMonths?: number | null;

  @ApiPropertyOptional({ description: 'Precio de venta — inventario Ventas' })
  salePrice?: number | null;

  @ApiPropertyOptional({
    description: 'Moneda del precio de venta (código catálogo, ej. PEN, USD)',
    default: 'PEN',
  })
  saleCurrency?: string;

  @ApiPropertyOptional({ description: 'Proyecto / urbanización' })
  projectName?: string | null;

  @ApiPropertyOptional({
    type: [PropertyMediaItemDto],
    description: 'Fotos y planos (URLs)',
  })
  mediaItems?: PropertyMediaItemDto[] | null;

  @ApiPropertyOptional({
    description:
      'Estado comercial (Ventas: AVAILABLE, RESERVED, SOLD; Alquileres: AVAILABLE, etc.)',
  })
  listingStatus?: string | null;
}
