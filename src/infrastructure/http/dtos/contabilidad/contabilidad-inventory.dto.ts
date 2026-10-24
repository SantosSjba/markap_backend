import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  UpdateInventoryItemInput,
} from '@domain/repositories/contabilidad-inventory.repository';

export class CreateInventoryMovementDto implements CreateInventoryMovementInput {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  movementType!: string;

  @IsDateOnly()
  @IsNotEmpty()
  movementDate!: string;

  @IsAmount()
  @IsNotEmpty()
  quantity!: number | string;

  @OptionalValue()
  @IsAmount()
  unitCost?: number | string;

  @OptionalValue()
  @IsString()
  offsetType?: string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UpdateInventoryItemDto implements UpdateInventoryItemInput {
  @OptionalValue()
  @IsString()
  description?: string;

  @OptionalValue()
  @IsString()
  accountId?: string;

  @OptionalValue()
  @IsString()
  unit?: string;

  @OptionalValue()
  @IsString()
  costMethod?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateInventoryItemDto implements CreateInventoryItemInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @OptionalValue()
  @IsString()
  unit?: string;

  @OptionalValue()
  @IsString()
  costMethod?: string;
}
