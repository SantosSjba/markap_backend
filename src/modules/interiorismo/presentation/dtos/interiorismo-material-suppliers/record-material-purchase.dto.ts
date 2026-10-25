import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
} from '../../../../../shared/presentation/validation/input-schemas';

export class RecordInteriorMaterialPurchaseDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    catalogMaterialId: z
      .string({ error: 'El campo «catalogMaterialId» no es válido.' })
      .uuid({ error: 'El campo «catalogMaterialId» no es válido.' })
      .nullish(),
    purchasedAt: isoDateInput,
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
    invoiceRef: z
      .string({ error: 'El campo «invoiceRef» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiPropertyOptional({
    description: 'Material del catálogo (opcional si es compra genérica)',
  })
  catalogMaterialId?: string | null;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  purchasedAt!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiPropertyOptional()
  invoiceRef?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
