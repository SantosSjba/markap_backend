import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreatePurchaseCreditNoteInput,
  CreatePurchaseDebitNoteInput,
  CreatePurchaseInvoiceInput,
  CreatePurchasePaymentInput,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@domain/repositories/contabilidad-purchases.repository';

export class CreatePurchasePaymentDto implements CreatePurchasePaymentInput {
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

export class CreatePurchaseDebitNoteDto implements CreatePurchaseDebitNoteInput {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

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

export class CreatePurchaseCreditNoteDto implements CreatePurchaseCreditNoteInput {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

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

export class CreatePurchaseInvoiceDto implements CreatePurchaseInvoiceInput {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

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
  expenseAccountId!: string;

  @IsAmount()
  @IsNotEmpty()
  taxableBase!: number | string;

  @OptionalValue()
  @IsAmount()
  igvAmount?: number | string;

  @OptionalValue()
  @IsAmount()
  detraccionAmount?: number | string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UpdateSupplierDto implements UpdateSupplierInput {
  @OptionalValue()
  @IsString()
  businessName?: string;

  @OptionalValue()
  @IsString()
  countryCode?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isNonDomiciled?: boolean;

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

export class CreateSupplierDto implements CreateSupplierInput {
  @IsString()
  @IsNotEmpty()
  ruc!: string;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @OptionalValue()
  @IsString()
  countryCode?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isNonDomiciled?: boolean;

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
