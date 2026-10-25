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
  CreatePurchaseCreditNoteInput,
  CreatePurchaseDebitNoteInput,
  CreatePurchaseInvoiceInput,
  CreatePurchasePaymentInput,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '../../../domain/repositories/contabilidad-purchases.repository';

export class CreatePurchasePaymentDto implements CreatePurchasePaymentInput {
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
    paymentDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de pago» es obligatorio.',
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

  paymentDate!: string;

  description!: string;

  sourceType!: 'CASH' | 'BANK';

  cashBoxId?: string | null;

  bankAccountId?: string | null;
}

export class CreatePurchaseDebitNoteDto implements CreatePurchaseDebitNoteInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    supplierId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «proveedor» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «proveedor» es obligatorio.' }),
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

  supplierId!: string;

  invoiceId?: string | null;

  periodId!: string;

  series!: string;

  number!: string;

  issueDate!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  reason?: string | null;
}

export class CreatePurchaseCreditNoteDto implements CreatePurchaseCreditNoteInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    supplierId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «proveedor» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «proveedor» es obligatorio.' }),
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

  supplierId!: string;

  invoiceId?: string | null;

  periodId!: string;

  series!: string;

  number!: string;

  issueDate!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  reason?: string | null;
}

export class CreatePurchaseInvoiceDto implements CreatePurchaseInvoiceInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    supplierId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «proveedor» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «proveedor» es obligatorio.' }),
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
    expenseAccountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta de gasto» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta de gasto» es obligatorio.',
        }),
    ),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    igvAmount: optionalValue(amountInput),
    detraccionAmount: optionalValue(amountInput),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  supplierId!: string;

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

  expenseAccountId!: string;

  taxableBase!: number | string;

  igvAmount?: number | string;

  detraccionAmount?: number | string;

  notes?: string | null;
}

export class UpdateSupplierDto implements UpdateSupplierInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    businessName: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «razón social» debe ser un texto.' }),
      ),
    ),
    countryCode: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «país» debe ser un texto.' }),
      ),
    ),
    isNonDomiciled: optionalValue(booleanInput),
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

  countryCode?: string;

  isNonDomiciled?: boolean;

  tradeName?: string | null;

  address?: string | null;

  email?: string | null;

  phone?: string | null;

  isActive?: boolean;
}

export class CreateSupplierDto implements CreateSupplierInput {
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
    countryCode: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «país» debe ser un texto.' }),
      ),
    ),
    isNonDomiciled: optionalValue(booleanInput),
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

  countryCode?: string;

  isNonDomiciled?: boolean;

  tradeName?: string | null;

  address?: string | null;

  email?: string | null;

  phone?: string | null;
}
