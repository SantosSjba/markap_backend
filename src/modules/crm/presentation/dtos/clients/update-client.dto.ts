import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

import { UBIGEO_OTHER_DISTRICT_ID } from '../../../../../shared/constants/ubigeo-other.constants';
import { LocationCustomDto } from './location-custom.dto';

class UpdateClientAddressDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z
    .strictObject({
      addressLine: z
        .preprocess(
          primitiveText,
          z.string({ error: 'El campo «dirección» debe ser un texto.' }),
        )
        .nullish(),
      districtId: z
        .preprocess(
          primitiveText,
          z.string({ error: 'El campo «distrito» debe ser un texto.' }),
        )
        .nullish(),
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

  @ApiPropertyOptional({ description: 'Dirección completa' })
  addressLine?: string;

  @ApiPropertyOptional({ description: 'ID del distrito (ubigeo)' })
  districtId?: string;

  @ApiPropertyOptional({
    description: 'Ubicación libre cuando distrito = Otros',
  })
  locationCustom?: LocationCustomDto | null;

  @ApiPropertyOptional({ description: 'Referencia' })
  reference?: string | null;
}

export class UpdateClientDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientType: z
      .enum(['OWNER', 'TENANT', 'BUYER', 'RESIDENTIAL', 'CORPORATE'], {
        error: 'El campo «tipo de cliente» no es una opción permitida.',
      })
      .nullish(),
    documentTypeId: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo de documento» debe ser un texto.' }),
      )
      .nullish(),
    documentNumber: z
      .preprocess(
        primitiveText,
        z.string({
          error: 'El campo «número de documento» debe ser un texto.',
        }),
      )
      .nullish(),
    fullName: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre completo» debe ser un texto.' }),
      )
      .nullish(),
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
    primaryPhone: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «teléfono principal» debe ser un texto.' }),
      )
      .nullish(),
    secondaryPhone: z
      .string({ error: 'El campo «secondaryPhone» debe ser un texto.' })
      .nullish(),
    primaryEmail: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «correo principal» debe ser un texto.' }),
      )
      .nullish(),
    secondaryEmail: z
      .string({ error: 'El campo «secondaryEmail» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
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
    address: z.lazy(() => UpdateClientAddressDto.schema).nullish(),
  });

  @ApiPropertyOptional({
    description: 'Tipo de cliente',
    enum: ['OWNER', 'TENANT', 'BUYER', 'RESIDENTIAL', 'CORPORATE'],
  })
  clientType?: 'OWNER' | 'TENANT' | 'BUYER' | 'RESIDENTIAL' | 'CORPORATE';

  @ApiPropertyOptional({ description: 'ID del tipo de documento' })
  documentTypeId?: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Nombre completo o Razón Social' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Representante legal' })
  legalRepresentativeName?: string | null;

  @ApiPropertyOptional({ description: 'Cargo del representante legal' })
  legalRepresentativePosition?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono principal' })
  primaryPhone?: string;

  @ApiPropertyOptional({ description: 'Teléfono secundario' })
  secondaryPhone?: string | null;

  @ApiPropertyOptional({ description: 'Email principal' })
  primaryEmail?: string;

  @ApiPropertyOptional({ description: 'Email secundario' })
  secondaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Embudo ventas',
    enum: ['PROSPECT', 'INTERESTED', 'CLIENT'],
  })
  salesStatus?: 'PROSPECT' | 'INTERESTED' | 'CLIENT' | null;

  @ApiPropertyOptional({ description: 'Origen del lead' })
  leadOrigin?: string | null;

  @ApiPropertyOptional({ description: 'Asesor asignado (id agente)' })
  assignedAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Dirección' })
  address?: UpdateClientAddressDto;
}
