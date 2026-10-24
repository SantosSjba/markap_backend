import { IsNotEmpty, IsString } from 'class-validator';
import {
  IsDateOnly,
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';

export class MarkPaidDto {
  @OptionalValue()
  @IsString()
  paidAt?: string | null;
}

export class CreateDocumentationCostDto {
  @IsString()
  @IsNotEmpty()
  saleClosingId!: string;

  @IsString()
  @IsNotEmpty()
  costType!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  amount!: number;

  @OptionalValue()
  @IsString()
  currency?: string;

  @OptionalValue()
  @IsString()
  description?: string | null;

  @OptionalValue()
  @IsDateOnly()
  expenseDate?: string | null;
}

export class UpsertAgentCommissionProfileDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  commissionPercent!: number;
}

export class CreateBuyerPaymentDto {
  @IsString()
  @IsNotEmpty()
  saleClosingId!: string;

  @IsString()
  @IsNotEmpty()
  kind!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  amount!: number;

  @OptionalValue()
  @IsString()
  currency?: string;

  @IsDateOnly()
  @IsNotEmpty()
  dueDate!: string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}
