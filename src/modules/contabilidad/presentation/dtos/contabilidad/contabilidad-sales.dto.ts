import { z } from 'zod';
import {
  amountInput,
  booleanInput,
  dateOnlyInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateCustomerInput,
  CreateSalesCollectionInput,
  CreateSalesCreditNoteInput,
  CreateSalesDebitNoteInput,
  CreateSalesInvoiceInput,
  UpdateCustomerInput,
} from '../../../domain/repositories/contabilidad-sales.repository';

export class CreateSalesCollectionDto implements CreateSalesCollectionInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    invoiceId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «comprobante» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «comprobante» es obligatorio.',
        }),
    ),
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    amount: amountInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    collectionDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de cobro» es obligatorio.',
    }),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «descripción» es obligatorio.',
        }),
    ),
    sourceType: z
      .enum(['CASH', 'BANK'], {
        error: 'El campo «origen de fondos» no es una opción permitida.',
      })
      .refine(isProvided, {
        error: 'El campo «origen de fondos» es obligatorio.',
      }),
    cashBoxId: optionalValue(
      z.string({ error: 'El campo «caja» debe ser un texto.' }),
    ),
    bankAccountId: optionalValue(
      z.string({ error: 'El campo «cuenta bancaria» debe ser un texto.' }),
    ),
  });

  invoiceId!: string;

  periodId!: string;

  amount!: number | string;

  collectionDate!: string;

  description!: string;

  sourceType!: 'CASH' | 'BANK';

  cashBoxId?: string | null;

  bankAccountId?: string | null;
}

export class CreateSalesDebitNoteDto implements CreateSalesDebitNoteInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    customerId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cliente» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «cliente» es obligatorio.' }),
    ),
    invoiceId: optionalValue(
      z.string({ error: 'El campo «comprobante» debe ser un texto.' }),
    ),
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    series: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «serie» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «serie» es obligatorio.' }),
    ),
    number: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «número» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «número» es obligatorio.' }),
    ),
    issueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de emisión» es obligatorio.',
    }),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    igvAmount: optionalValue(amountInput),
    reason: optionalValue(
      z.string({ error: 'El campo «motivo» debe ser un texto.' }),
    ),
  });

  customerId!: string;

  invoiceId?: string | null;

  periodId!: string;

  series!: string;

  number!: string;

  issueDate!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  reason?: string | null;
}

export class CreateSalesCreditNoteDto implements CreateSalesCreditNoteInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    customerId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cliente» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «cliente» es obligatorio.' }),
    ),
    invoiceId: optionalValue(
      z.string({ error: 'El campo «comprobante» debe ser un texto.' }),
    ),
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    series: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «serie» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «serie» es obligatorio.' }),
    ),
    number: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «número» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «número» es obligatorio.' }),
    ),
    issueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de emisión» es obligatorio.',
    }),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    igvAmount: optionalValue(amountInput),
    reason: optionalValue(
      z.string({ error: 'El campo «motivo» debe ser un texto.' }),
    ),
  });

  customerId!: string;

  invoiceId?: string | null;

  periodId!: string;

  series!: string;

  number!: string;

  issueDate!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  reason?: string | null;
}

export class CreateSalesInvoiceDto implements CreateSalesInvoiceInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    customerId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cliente» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «cliente» es obligatorio.' }),
    ),
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    documentType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de documento» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de documento» es obligatorio.',
        }),
    ),
    series: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «serie» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «serie» es obligatorio.' }),
    ),
    number: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «número» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «número» es obligatorio.' }),
    ),
    issueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de emisión» es obligatorio.',
    }),
    dueDate: optionalValue(dateOnlyInput),
    taxAffectation: z.preprocess(
      primitiveText,
      z
        .string({
          error: 'El campo «afectación tributaria» debe ser un texto.',
        })
        .refine(isProvided, {
          error: 'El campo «afectación tributaria» es obligatorio.',
        }),
    ),
    currencyCode: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    exchangeRate: optionalValue(amountInput),
    foreignTaxableBase: optionalValue(amountInput),
    incomeAccountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta de ingreso» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta de ingreso» es obligatorio.',
        }),
    ),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    igvAmount: optionalValue(amountInput),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  customerId!: string;

  periodId!: string;

  documentType!: string;

  series!: string;

  number!: string;

  issueDate!: string;

  dueDate?: string | null;

  taxAffectation!: string;

  currencyCode?: string;

  exchangeRate?: number | string | null;

  foreignTaxableBase?: number | string | null;

  incomeAccountId!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  notes?: string | null;
}

export class UpdateCustomerDto implements UpdateCustomerInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    businessName: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «razón social» debe ser un texto.' }),
      ),
    ),
    tradeName: optionalValue(
      z.string({ error: 'El campo «nombre comercial» debe ser un texto.' }),
    ),
    address: optionalValue(
      z.string({ error: 'El campo «dirección» debe ser un texto.' }),
    ),
    email: optionalValue(
      z.string({ error: 'El campo «correo» debe ser un texto.' }),
    ),
    phone: optionalValue(
      z.string({ error: 'El campo «teléfono» debe ser un texto.' }),
    ),
    isActive: optionalValue(booleanInput),
  });

  businessName?: string;

  tradeName?: string | null;

  address?: string | null;

  email?: string | null;

  phone?: string | null;

  isActive?: boolean;
}

export class CreateCustomerDto implements CreateCustomerInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    ruc: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «RUC» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «RUC» es obligatorio.' }),
    ),
    businessName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «razón social» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «razón social» es obligatorio.',
        }),
    ),
    tradeName: optionalValue(
      z.string({ error: 'El campo «nombre comercial» debe ser un texto.' }),
    ),
    address: optionalValue(
      z.string({ error: 'El campo «dirección» debe ser un texto.' }),
    ),
    email: optionalValue(
      z.string({ error: 'El campo «correo» debe ser un texto.' }),
    ),
    phone: optionalValue(
      z.string({ error: 'El campo «teléfono» debe ser un texto.' }),
    ),
  });

  ruc!: string;

  businessName!: string;

  tradeName?: string | null;

  address?: string | null;

  email?: string | null;

  phone?: string | null;
}
