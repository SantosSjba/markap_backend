import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export class LinkSupplierCatalogMaterialDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    catalogMaterialId: z
      .string({ error: 'El campo «catalogMaterialId» no es válido.' })
      .uuid({ error: 'El campo «catalogMaterialId» no es válido.' }),
    supplierSku: z
      .string({ error: 'El campo «supplierSku» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  catalogMaterialId!: string;

  @ApiPropertyOptional()
  supplierSku?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
