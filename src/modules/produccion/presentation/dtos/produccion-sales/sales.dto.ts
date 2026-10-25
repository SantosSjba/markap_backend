import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class SalesLineDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    furnitureId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «mueble» debe ser un texto.' })
        .min(1, { error: 'El campo «mueble» es demasiado corto.' }),
    ),
    quantity: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «cantidad» debe ser un número válido.' })
        .min(0.0001, {
          error: 'El campo «cantidad» es menor que el mínimo permitido.',
        }),
    ),
    unitPrice: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «precio unitario» debe ser un número válido.',
        })
        .min(0, {
          error: 'El campo «precio unitario» es menor que el mínimo permitido.',
        }),
    ),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  furnitureId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class CreateProduccionQuotationDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cliente» debe ser un texto.' })
        .min(1, { error: 'El campo «cliente» es demasiado corto.' }),
    ),
    validUntil: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z.array(
      z.lazy(() => SalesLineDto.schema),
      { error: 'El campo «líneas» debe ser una lista.' },
    ),
  });

  @ApiProperty()
  clientId!: string;

  @ApiPropertyOptional()
  validUntil?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: [SalesLineDto] })
  lines!: SalesLineDto[];
}

export class UpdateProduccionQuotationDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientId: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «cliente» debe ser un texto.' }),
      )
      .nullish(),
    validUntil: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z
      .array(
        z.lazy(() => SalesLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiPropertyOptional()
  clientId?: string;

  @ApiPropertyOptional()
  validUntil?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: [SalesLineDto] })
  lines?: SalesLineDto[];
}

export class CreateProduccionOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cliente» debe ser un texto.' })
        .min(1, { error: 'El campo «cliente» es demasiado corto.' }),
    ),
    quotationId: z
      .string({ error: 'El campo «quotationId» debe ser un texto.' })
      .nullish(),
    orderedAt: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z.array(
      z.lazy(() => SalesLineDto.schema),
      { error: 'El campo «líneas» debe ser una lista.' },
    ),
  });

  @ApiProperty()
  clientId!: string;

  @ApiPropertyOptional()
  quotationId?: string | null;

  @ApiPropertyOptional()
  orderedAt?: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: [SalesLineDto] })
  lines!: SalesLineDto[];
}

export class UpdateProduccionOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiPropertyOptional()
  notes?: string | null;
}

export class CreateProduccionDeliveryDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    orderId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «orderId» debe ser un texto.' })
        .min(1, { error: 'El campo «orderId» es demasiado corto.' }),
    ),
    scheduledAt: isoDateInput.nullish(),
    address: z
      .string({ error: 'El campo «dirección» debe ser un texto.' })
      .nullish(),
    recipientName: z
      .string({ error: 'El campo «recipientName» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  orderId!: string;

  @ApiPropertyOptional()
  scheduledAt?: string | null;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiPropertyOptional()
  recipientName?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class UpdateProduccionDeliveryDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    scheduledAt: isoDateInput.nullish(),
    address: z
      .string({ error: 'El campo «dirección» debe ser un texto.' })
      .nullish(),
    recipientName: z
      .string({ error: 'El campo «recipientName» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiPropertyOptional()
  scheduledAt?: string | null;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiPropertyOptional()
  recipientName?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
