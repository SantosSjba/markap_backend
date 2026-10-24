import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateDetraccionInput,
  CreatePerceptionInput,
  CreateRetentionInput,
  PayDetraccionInput,
} from '@domain/repositories/contabilidad-taxes.repository';

export class CreatePerceptionDto implements CreatePerceptionInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  perceptionType!: string;

  @IsString()
  @IsNotEmpty()
  customerRuc!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @OptionalValue()
  @IsString()
  salesInvoiceId?: string | null;

  @IsDateOnly()
  @IsNotEmpty()
  issueDate!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  ratePercent?: number | string;

  @OptionalValue()
  @IsAmount()
  amount?: number | string;

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
  description!: string;
}

export class CreateRetentionDto implements CreateRetentionInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  retentionType!: string;

  @IsString()
  @IsNotEmpty()
  counterpartyRuc!: string;

  @IsString()
  @IsNotEmpty()
  counterpartyName!: string;

  @OptionalValue()
  @IsString()
  documentType?: string | null;

  @OptionalValue()
  @IsString()
  documentSeries?: string | null;

  @OptionalValue()
  @IsString()
  documentNumber?: string | null;

  @IsDateOnly()
  @IsNotEmpty()
  issueDate!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  ratePercent?: number | string;

  @OptionalValue()
  @IsAmount()
  amount?: number | string;

  @OptionalValue()
  @IsString()
  purchaseInvoiceId?: string | null;
}

export class PayDetraccionDto implements PayDetraccionInput {
  @IsDateOnly()
  @IsNotEmpty()
  paymentDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(['CASH', 'BANK'])
  @IsNotEmpty()
  sourceType!: 'CASH' | 'BANK';

  @OptionalValue()
  @IsString()
  cashBoxId?: string | null;

  @OptionalValue()
  @IsString()
  bankAccountId?: string | null;
}

export class CreateDetraccionDto implements CreateDetraccionInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @OptionalValue()
  @IsString()
  purchaseInvoiceId?: string | null;

  @OptionalValue()
  @IsString()
  rateId?: string | null;

  @IsString()
  @IsNotEmpty()
  supplierRuc!: string;

  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsString()
  @IsNotEmpty()
  certificateNumber!: string;

  @IsDateOnly()
  @IsNotEmpty()
  operationDate!: string;

  @IsAmount()
  @IsNotEmpty()
  baseAmount!: number | string;

  @OptionalValue()
  @IsAmount()
  ratePercent?: number | string;

  @OptionalValue()
  @IsAmount()
  amount?: number | string;
}
