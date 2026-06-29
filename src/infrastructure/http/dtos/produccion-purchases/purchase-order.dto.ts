import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderLineDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  materialId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantityOrdered!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateProduccionPurchaseOrderDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}

export class UpdateProduccionPurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines?: PurchaseOrderLineDto[];
}

export class ReceivePurchaseOrderLineDto {
  @ApiProperty()
  @IsString()
  lineId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}

export class ReceiveProduccionPurchaseOrderDto {
  @ApiProperty({ type: [ReceivePurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderLineDto)
  lines!: ReceivePurchaseOrderLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
