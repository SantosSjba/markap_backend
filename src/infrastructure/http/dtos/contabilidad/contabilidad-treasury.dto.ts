import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateBankAccountInput,
  CreateCashBoxInput,
  CreateTreasuryMovementInput,
  CreateTreasuryTransferInput,
  UpdateBankAccountInput,
  UpdateCashBoxInput,
  UpsertReconciliationInput,
} from '@domain/repositories/contabilidad-treasury.repository';

export class UpsertReconciliationDto implements UpsertReconciliationInput {
  @IsString()
  @IsNotEmpty()
  bankAccountId!: string;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsAmount()
  @IsNotEmpty()
  statementBalance!: number | string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class CreateTreasuryTransferDto implements CreateTreasuryTransferInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsIn(['CASH', 'BANK'])
  @IsNotEmpty()
  fromType!: 'CASH' | 'BANK';

  @OptionalValue()
  @IsString()
  fromCashBoxId?: string | null;

  @OptionalValue()
  @IsString()
  fromBankAccountId?: string | null;

  @IsIn(['CASH', 'BANK'])
  @IsNotEmpty()
  toType!: 'CASH' | 'BANK';

  @OptionalValue()
  @IsString()
  toCashBoxId?: string | null;

  @OptionalValue()
  @IsString()
  toBankAccountId?: string | null;

  @IsAmount()
  @IsNotEmpty()
  amount!: number | string;

  @IsDateOnly()
  @IsNotEmpty()
  movementDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateTreasuryMovementDto implements CreateTreasuryMovementInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsIn(['IN', 'OUT'])
  @IsNotEmpty()
  movementType!: 'IN' | 'OUT';

  @IsIn(['CASH', 'BANK'])
  @IsNotEmpty()
  sourceType!: 'CASH' | 'BANK';

  @OptionalValue()
  @IsString()
  cashBoxId?: string | null;

  @OptionalValue()
  @IsString()
  bankAccountId?: string | null;

  @IsString()
  @IsNotEmpty()
  offsetAccountId!: string;

  @IsAmount()
  @IsNotEmpty()
  amount!: number | string;

  @OptionalValue()
  @IsAmount()
  foreignAmount?: number | string | null;

  @OptionalValue()
  @IsAmount()
  exchangeRate?: number | string | null;

  @IsDateOnly()
  @IsNotEmpty()
  movementDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class UpdateBankAccountDto implements UpdateBankAccountInput {
  @OptionalValue()
  @IsString()
  code?: string;

  @OptionalValue()
  @IsString()
  bankName?: string;

  @OptionalValue()
  @IsString()
  accountNumber?: string;

  @OptionalValue()
  @IsString()
  cci?: string | null;

  @OptionalValue()
  @IsString()
  currency?: string;

  @OptionalValue()
  @IsString()
  accountId?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBankAccountDto implements CreateBankAccountInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @OptionalValue()
  @IsString()
  cci?: string | null;

  @OptionalValue()
  @IsString()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  accountId!: string;
}

export class UpdateCashBoxDto implements UpdateCashBoxInput {
  @OptionalValue()
  @IsString()
  code?: string;

  @OptionalValue()
  @IsString()
  name?: string;

  @OptionalValue()
  @IsString()
  accountId?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCashBoxDto implements CreateCashBoxInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
