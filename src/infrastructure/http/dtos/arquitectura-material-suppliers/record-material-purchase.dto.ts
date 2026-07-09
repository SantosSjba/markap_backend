import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RecordArquitecturaMaterialPurchaseDto {
  @ApiPropertyOptional({ description: 'Material del catálogo (opcional si es compra genérica)' })
  @IsOptional()
  @IsUUID()
  catalogMaterialId?: string | null;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  @IsDateString()
  purchasedAt!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceRef?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
