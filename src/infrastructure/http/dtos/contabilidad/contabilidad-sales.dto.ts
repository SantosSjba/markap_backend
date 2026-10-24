import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateCustomerInput,
  CreateSalesCollectionInput,
  CreateSalesCreditNoteInput,
  CreateSalesDebitNoteInput,
  CreateSalesInvoiceInput,
  UpdateCustomerInput,
} from '@domain/repositories/contabilidad-sales.repository';

export class CreateSalesCollectionDto implements CreateSalesCollectionInput {
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsAmount()
  @IsNotEmpty()
  amount!: number | string;

  @IsDateOnly()
  @IsNotEmpty()
  collectionDate!: string;

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

export class CreateSalesDebitNoteDto implements CreateSalesDebitNoteInput {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @OptionalValue()
  @IsString()
  invoiceId?: string | null;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  series!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsDateOnly()
  @IsNotEmpty()
  issueDate!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  igvAmount?: number | string;

  @OptionalValue()
  @IsString()
  reason?: string | null;
}

export class CreateSalesCreditNoteDto implements CreateSalesCreditNoteInput {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @OptionalValue()
  @IsString()
  invoiceId?: string | null;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  series!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsDateOnly()
  @IsNotEmpty()
  issueDate!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  igvAmount?: number | string;

  @OptionalValue()
  @IsString()
  reason?: string | null;
}

export class CreateSalesInvoiceDto implements CreateSalesInvoiceInput {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  series!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsDateOnly()
  @IsNotEmpty()
  issueDate!: string;

  @OptionalValue()
  @IsDateOnly()
  dueDate?: string | null;

  @IsString()
  @IsNotEmpty()
  taxAffectation!: string;

  @OptionalValue()
  @IsString()
  currencyCode?: string;

  @OptionalValue()
  @IsAmount()
  exchangeRate?: number | string | null;

  @OptionalValue()
  @IsAmount()
  foreignTaxableBase?: number | string | null;

  @IsString()
  @IsNotEmpty()
  incomeAccountId!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  igvAmount?: number | string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UpdateCustomerDto implements UpdateCustomerInput {
  @OptionalValue()
  @IsString()
  businessName?: string;

  @OptionalValue()
  @IsString()
  tradeName?: string | null;

  @OptionalValue()
  @IsString()
  address?: string | null;

  @OptionalValue()
  @IsString()
  email?: string | null;

  @OptionalValue()
  @IsString()
  phone?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCustomerDto implements CreateCustomerInput {
  @IsString()
  @IsNotEmpty()
  ruc!: string;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @OptionalValue()
  @IsString()
  tradeName?: string | null;

  @OptionalValue()
  @IsString()
  address?: string | null;

  @OptionalValue()
  @IsString()
  email?: string | null;

  @OptionalValue()
  @IsString()
  phone?: string | null;
}
