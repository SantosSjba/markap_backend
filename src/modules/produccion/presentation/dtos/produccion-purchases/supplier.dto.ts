import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProduccionSupplierDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    companyName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «empresa» debe ser un texto.' })
        .min(1, { error: 'El campo «empresa» es demasiado corto.' }),
    ),
    ruc: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «RUC» debe ser un texto.' })
        .min(8, { error: 'El campo «RUC» es demasiado corto.' }),
    ),
    contactName: z
      .string({ error: 'El campo «contacto» debe ser un texto.' })
      .nullish(),
    phone: z
      .string({ error: 'El campo «teléfono» debe ser un texto.' })
      .nullish(),
    email: z
      .string({
        error: 'El campo «correo» debe ser un correo electrónico válido.',
      })
      .email({
        error: 'El campo «correo» debe ser un correo electrónico válido.',
      })
      .nullish(),
    isActive: booleanInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  companyName!: string;

  @ApiProperty()
  ruc!: string;

  @ApiPropertyOptional()
  contactName?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class UpdateProduccionSupplierDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    companyName: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «empresa» debe ser un texto.' })
          .min(1, { error: 'El campo «empresa» es demasiado corto.' }),
      )
      .nullish(),
    ruc: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «RUC» debe ser un texto.' })
          .min(8, { error: 'El campo «RUC» es demasiado corto.' }),
      )
      .nullish(),
    contactName: z
      .string({ error: 'El campo «contacto» debe ser un texto.' })
      .nullish(),
    phone: z
      .string({ error: 'El campo «teléfono» debe ser un texto.' })
      .nullish(),
    email: z
      .string({
        error: 'El campo «correo» debe ser un correo electrónico válido.',
      })
      .email({
        error: 'El campo «correo» debe ser un correo electrónico válido.',
      })
      .nullish(),
    isActive: booleanInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiPropertyOptional()
  companyName?: string;

  @ApiPropertyOptional()
  ruc?: string;

  @ApiPropertyOptional()
  contactName?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class LinkProduccionSupplierMaterialDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    materialId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «material» debe ser un texto.' })
        .min(1, { error: 'El campo «material» es demasiado corto.' }),
    ),
    supplierSku: z
      .string({ error: 'El campo «supplierSku» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  materialId!: string;

  @ApiPropertyOptional()
  supplierSku?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
