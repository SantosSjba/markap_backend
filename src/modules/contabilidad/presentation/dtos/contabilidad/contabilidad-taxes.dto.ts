import { z } from 'zod';
import {
  amountInput,
  dateOnlyInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateDetraccionInput,
  CreatePerceptionInput,
  CreateRetentionInput,
  PayDetraccionInput,
} from '../../../domain/repositories/contabilidad-taxes.repository';

export class CreatePerceptionDto implements CreatePerceptionInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    perceptionType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de percepción» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de percepción» es obligatorio.',
        }),
    ),
    customerRuc: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «RUC del cliente» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «RUC del cliente» es obligatorio.',
        }),
    ),
    customerName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre del cliente» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «nombre del cliente» es obligatorio.',
        }),
    ),
    salesInvoiceId: optionalValue(
      z.string({ error: 'El campo «comprobante de venta» debe ser un texto.' }),
    ),
    issueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de emisión» es obligatorio.',
    }),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    ratePercent: optionalValue(amountInput),
    amount: optionalValue(amountInput),
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
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «descripción» es obligatorio.',
        }),
    ),
  });

  periodId!: string;

  perceptionType!: string;

  customerRuc!: string;

  customerName!: string;

  salesInvoiceId?: string | null;

  issueDate!: string;

  taxableBase!: number | string;

  ratePercent?: number | string;

  amount?: number | string;

  sourceType!: 'CASH' | 'BANK';

  cashBoxId?: string | null;

  bankAccountId?: string | null;

  description!: string;
}

export class CreateRetentionDto implements CreateRetentionInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    retentionType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de retención» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de retención» es obligatorio.',
        }),
    ),
    counterpartyRuc: z.preprocess(
      primitiveText,
      z
        .string({
          error: 'El campo «RUC de la contraparte» debe ser un texto.',
        })
        .refine(isProvided, {
          error: 'El campo «RUC de la contraparte» es obligatorio.',
        }),
    ),
    counterpartyName: z.preprocess(
      primitiveText,
      z
        .string({
          error: 'El campo «nombre de la contraparte» debe ser un texto.',
        })
        .refine(isProvided, {
          error: 'El campo «nombre de la contraparte» es obligatorio.',
        }),
    ),
    documentType: optionalValue(
      z.string({ error: 'El campo «tipo de documento» debe ser un texto.' }),
    ),
    documentSeries: optionalValue(
      z.string({ error: 'El campo «serie del documento» debe ser un texto.' }),
    ),
    documentNumber: optionalValue(
      z.string({ error: 'El campo «número de documento» debe ser un texto.' }),
    ),
    issueDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de emisión» es obligatorio.',
    }),
    taxableBase: amountInput.refine(isProvided, {
      error: 'El campo «base imponible» es obligatorio.',
    }),
    ratePercent: optionalValue(amountInput),
    amount: optionalValue(amountInput),
    purchaseInvoiceId: optionalValue(
      z.string({ error: 'El campo «factura de compra» debe ser un texto.' }),
    ),
  });

  periodId!: string;

  retentionType!: string;

  counterpartyRuc!: string;

  counterpartyName!: string;

  documentType?: string | null;

  documentSeries?: string | null;

  documentNumber?: string | null;

  issueDate!: string;

  taxableBase!: number | string;

  ratePercent?: number | string;

  amount?: number | string;

  purchaseInvoiceId?: string | null;
}

export class PayDetraccionDto implements PayDetraccionInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
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

  paymentDate!: string;

  description!: string;

  sourceType!: 'CASH' | 'BANK';

  cashBoxId?: string | null;

  bankAccountId?: string | null;
}

export class CreateDetraccionDto implements CreateDetraccionInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    periodId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «periodo contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «periodo contable» es obligatorio.',
        }),
    ),
    purchaseInvoiceId: optionalValue(
      z.string({ error: 'El campo «factura de compra» debe ser un texto.' }),
    ),
    rateId: optionalValue(
      z.string({ error: 'El campo «tasa» debe ser un texto.' }),
    ),
    supplierRuc: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «RUC del proveedor» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «RUC del proveedor» es obligatorio.',
        }),
    ),
    supplierName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre del proveedor» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «nombre del proveedor» es obligatorio.',
        }),
    ),
    certificateNumber: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «número de constancia» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «número de constancia» es obligatorio.',
        }),
    ),
    operationDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha de operación» es obligatorio.',
    }),
    baseAmount: amountInput.refine(isProvided, {
      error: 'El campo «monto base» es obligatorio.',
    }),
    ratePercent: optionalValue(amountInput),
    amount: optionalValue(amountInput),
  });

  periodId!: string;

  purchaseInvoiceId?: string | null;

  rateId?: string | null;

  supplierRuc!: string;

  supplierName!: string;

  certificateNumber!: string;

  operationDate!: string;

  baseAmount!: number | string;

  ratePercent?: number | string;

  amount?: number | string;
}
