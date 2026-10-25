import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class PurchaseOrderLineDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    materialId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «material» debe ser un texto.' })
        .min(1, { error: 'El campo «material» es demasiado corto.' }),
    ),
    quantityOrdered: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «quantityOrdered» debe ser un número válido.',
        })
        .min(0.0001, {
          error: 'El campo «quantityOrdered» es menor que el mínimo permitido.',
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
  });

  @ApiProperty()
  materialId!: string;

  @ApiProperty()
  quantityOrdered!: number;

  @ApiProperty()
  unitPrice!: number;
}

export class CreateProduccionPurchaseOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    supplierId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «proveedor» debe ser un texto.' })
        .min(1, { error: 'El campo «proveedor» es demasiado corto.' }),
    ),
    orderedAt: isoDateInput.nullish(),
    expectedAt: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z.array(
      z.lazy(() => PurchaseOrderLineDto.schema),
      { error: 'El campo «líneas» debe ser una lista.' },
    ),
  });

  @ApiProperty()
  supplierId!: string;

  @ApiPropertyOptional()
  orderedAt?: string;

  @ApiPropertyOptional()
  expectedAt?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  lines!: PurchaseOrderLineDto[];
}

export class UpdateProduccionPurchaseOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    supplierId: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «proveedor» debe ser un texto.' }),
      )
      .nullish(),
    orderedAt: isoDateInput.nullish(),
    expectedAt: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z
      .array(
        z.lazy(() => PurchaseOrderLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiPropertyOptional()
  supplierId?: string;

  @ApiPropertyOptional()
  orderedAt?: string;

  @ApiPropertyOptional()
  expectedAt?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  lines?: PurchaseOrderLineDto[];
}

export class ReceivePurchaseOrderLineDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    lineId: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «lineId» debe ser un texto.' }),
    ),
    quantity: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «cantidad» debe ser un número válido.' })
        .min(0.0001, {
          error: 'El campo «cantidad» es menor que el mínimo permitido.',
        }),
    ),
  });

  @ApiProperty()
  lineId!: string;

  @ApiProperty()
  quantity!: number;
}

export class ReceiveProduccionPurchaseOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    lines: z.array(
      z.lazy(() => ReceivePurchaseOrderLineDto.schema),
      { error: 'El campo «líneas» debe ser una lista.' },
    ),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty({ type: [ReceivePurchaseOrderLineDto] })
  lines!: ReceivePurchaseOrderLineDto[];

  @ApiPropertyOptional()
  notes?: string | null;
}
