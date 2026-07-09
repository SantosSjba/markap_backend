import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectBudgetSectionDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProjectBudgetSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateProjectBudgetLineItemDto {
  @IsUUID()
  sectionId!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetedCost!: number;

  @IsOptional()
  @IsBoolean()
  hasIgv?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualPurchaseCost?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string | null;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;
}

export class UpdateProjectBudgetLineItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetedCost?: number;

  @IsOptional()
  @IsBoolean()
  hasIgv?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualPurchaseCost?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string | null;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;
}

export class CreateLineItemSupplierPaymentDto {
  @IsUUID()
  lineItemId!: string;

  @IsInt()
  @Min(1)
  paymentNumber!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  paidAt!: string;
}
