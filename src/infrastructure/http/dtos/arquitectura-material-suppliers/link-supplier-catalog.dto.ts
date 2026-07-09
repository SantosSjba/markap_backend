import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LinkSupplierCatalogMaterialDto {
  @ApiProperty()
  @IsUUID()
  catalogMaterialId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierSku?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
