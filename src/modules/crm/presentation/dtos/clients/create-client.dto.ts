import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

import { UBIGEO_OTHER_DISTRICT_ID } from '../../../../../shared/constants/ubigeo-other.constants';
import { LocationCustomDto } from './location-custom.dto';

class CreateClientAddressDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z
    .strictObject({
      addressLine: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «dirección» debe ser un texto.' }),
      ),
      districtId: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «distrito» debe ser un texto.' }),
      ),
      locationCustom: z.unknown().optional(),
      reference: z
        .string({ error: 'El campo «referencia» debe ser un texto.' })
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

  @ApiProperty({ description: 'Dirección completa' })
  addressLine: string;

  @ApiProperty({ description: 'ID del distrito (ubigeo)' })
  districtId: string;

  @ApiPropertyOptional({
    description:
      'Ubicación libre cuando distrito = Otros (país, departamento, provincia, distrito)',
  })
  locationCustom?: LocationCustomDto;

  @ApiPropertyOptional({ description: 'Referencia' })
  reference?: string | null;
}

export class CreateClientDto {
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
      clientType: z.enum(
        ['OWNER', 'TENANT', 'BUYER', 'RESIDENTIAL', 'CORPORATE'],
        { error: 'El campo «tipo de cliente» no es una opción permitida.' },
      ),
      documentTypeId: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo de documento» debe ser un texto.' }),
      ),
      documentNumber: z.preprocess(
        primitiveText,
        z.string({
          error: 'El campo «número de documento» debe ser un texto.',
        }),
      ),
      fullName: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre completo» debe ser un texto.' }),
      ),
      legalRepresentativeName: z
        .string({
          error: 'El campo «legalRepresentativeName» debe ser un texto.',
        })
        .nullish(),
      legalRepresentativePosition: z
        .string({
          error: 'El campo «legalRepresentativePosition» debe ser un texto.',
        })
        .nullish(),
      primaryPhone: z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «teléfono principal» debe ser un texto.' }),
      ),
      secondaryPhone: z
        .string({ error: 'El campo «secondaryPhone» debe ser un texto.' })
        .nullish(),
      primaryEmail: z
        .string({ error: 'El campo «correo principal» debe ser un texto.' })
        .nullish(),
      secondaryEmail: z
        .string({ error: 'El campo «secondaryEmail» debe ser un texto.' })
        .nullish(),
      notes: z
        .string({ error: 'El campo «notas» debe ser un texto.' })
        .nullish(),
      salesStatus: z
        .enum(['PROSPECT', 'INTERESTED', 'CLIENT'], {
          error: 'El campo «salesStatus» no es válido.',
        })
        .nullish(),
      leadOrigin: z
        .string({ error: 'El campo «leadOrigin» debe ser un texto.' })
        .max(120, { error: 'El campo «leadOrigin» es demasiado largo.' })
        .nullish(),
      assignedAgentId: z
        .string({ error: 'El campo «agente asignado» debe ser un texto.' })
        .nullish(),
      address: z.unknown().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.clientType === 'OWNER' || value.clientType === 'TENANT') {
        const result = z
          .lazy(() => CreateClientAddressDto.schema)
          .safeParse(value['address']);
        if (!result.success) {
          for (const issue of result.error.issues)
            ctx.addIssue({ ...issue, path: ['address', ...issue.path] });
        } else {
          value['address'] = result.data;
        }
      }
    });

  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Slug de la aplicación (ej: alquileres, ventas)',
  })
  applicationSlug?: string;

  @ApiProperty({
    description:
      'Propietario, inquilino, comprador (ventas) o cliente interiorismo (residencial/corporativo)',
    enum: ['OWNER', 'TENANT', 'BUYER', 'RESIDENTIAL', 'CORPORATE'],
  })
  clientType: 'OWNER' | 'TENANT' | 'BUYER' | 'RESIDENTIAL' | 'CORPORATE';

  @ApiProperty({ description: 'ID del tipo de documento' })
  documentTypeId: string;

  @ApiProperty({ description: 'Número de documento' })
  documentNumber: string;

  @ApiProperty({ description: 'Nombre completo o Razón Social' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Representante legal' })
  legalRepresentativeName?: string | null;

  @ApiPropertyOptional({ description: 'Cargo del representante legal' })
  legalRepresentativePosition?: string | null;

  @ApiProperty({ description: 'Teléfono principal' })
  primaryPhone: string;

  @ApiPropertyOptional({ description: 'Teléfono secundario' })
  secondaryPhone?: string | null;

  @ApiPropertyOptional({
    description: 'Email principal (opcional en alquileres y ventas)',
  })
  primaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Email secundario' })
  secondaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Embudo ventas (solo BUYER)',
    enum: ['PROSPECT', 'INTERESTED', 'CLIENT'],
  })
  salesStatus?: 'PROSPECT' | 'INTERESTED' | 'CLIENT';

  @ApiPropertyOptional({ description: 'Origen del lead (Facebook, web, etc.)' })
  leadOrigin?: string | null;

  @ApiPropertyOptional({ description: 'ID del asesor (agente) asignado' })
  assignedAgentId?: string | null;

  @ApiPropertyOptional({
    description:
      'Dirección obligatoria para propietario (ventas o alquileres) e inquilino (alquileres). Opcional en interiorismo.',
  })
  address?: CreateClientAddressDto;
}
