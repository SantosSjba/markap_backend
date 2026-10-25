import { z } from 'zod';
import {
  amountInput,
  booleanInput,
  dateOnlyInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  CreateElectronicDocumentLogInput,
  CreateJournalTemplateInput,
  JournalTemplateLineInput,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
  UpsertIncomeTaxPeriodInput,
} from '../../../domain/repositories/contabilidad-extensions.repository';

export class JournalTemplateLineDto implements JournalTemplateLineInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    lineNumber: numericInput.refine(isProvided, {
      error: 'El campo «número de línea» es obligatorio.',
    }),
    accountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta contable» es obligatorio.',
        }),
    ),
    defaultDebit: optionalValue(amountInput),
    defaultCredit: optionalValue(amountInput),
    costCenterId: optionalValue(
      z.string({ error: 'El campo «centro de costo» debe ser un texto.' }),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
  });

  lineNumber!: number;

  accountId!: string;

  defaultDebit?: number | string;

  defaultCredit?: number | string;

  costCenterId?: string | null;

  description?: string | null;
}

export class UpsertIncomeTaxPeriodDto implements UpsertIncomeTaxPeriodInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    deductibleAdjustments: optionalValue(amountInput),
    nonDeductibleAdjustments: optionalValue(amountInput),
    otherIncomeAdjustments: optionalValue(amountInput),
    otherExpenseAdjustments: optionalValue(amountInput),
    advancePaymentAmount: optionalValue(amountInput),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  deductibleAdjustments?: number | string;

  nonDeductibleAdjustments?: number | string;

  otherIncomeAdjustments?: number | string;

  otherExpenseAdjustments?: number | string;

  advancePaymentAmount?: number | string;

  notes?: string | null;
}

export class CreateElectronicDocumentLogDto implements CreateElectronicDocumentLogInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    periodId: optionalValue(
      z.string({ error: 'El campo «periodo contable» debe ser un texto.' }),
    ),
    documentKind: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de comprobante» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de comprobante» es obligatorio.',
        }),
    ),
    documentRef: z.preprocess(
      primitiveText,
      z
        .string({
          error: 'El campo «referencia del comprobante» debe ser un texto.',
        })
        .refine(isProvided, {
          error: 'El campo «referencia del comprobante» es obligatorio.',
        }),
    ),
    sunatStatus: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «estado SUNAT» debe ser un texto.' }),
      ),
    ),
    xmlHash: optionalValue(
      z.string({ error: 'El campo «hash XML» debe ser un texto.' }),
    ),
    cdrReference: optionalValue(
      z.string({ error: 'El campo «referencia CDR» debe ser un texto.' }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  periodId?: string | null;

  documentKind!: string;

  documentRef!: string;

  sunatStatus?: string;

  xmlHash?: string | null;

  cdrReference?: string | null;

  notes?: string | null;
}

export class UpdateJournalTemplateDto implements UpdateJournalTemplateInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre» debe ser un texto.' }),
      ),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
    isActive: optionalValue(booleanInput),
    lines: optionalValue(
      z.array(
        z.lazy(() => JournalTemplateLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      ),
    ),
  });

  name?: string;

  description?: string | null;

  isActive?: boolean;

  lines?: JournalTemplateLineInput[];
}

export class CreateJournalTemplateDto implements CreateJournalTemplateInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «nombre» es obligatorio.' }),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
    isActive: optionalValue(booleanInput),
    lines: z
      .array(
        z.lazy(() => JournalTemplateLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «líneas» es obligatorio.' }),
  });

  name!: string;

  description?: string | null;

  isActive?: boolean;

  lines!: JournalTemplateLineInput[];
}

export class UpsertExchangeRateDto implements UpsertExchangeRateInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    rateDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha del tipo de cambio» es obligatorio.',
    }),
    currencyCode: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «moneda» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «moneda» es obligatorio.' }),
    ),
    buyRate: amountInput.refine(isProvided, {
      error: 'El campo «tipo de cambio compra» es obligatorio.',
    }),
    sellRate: amountInput.refine(isProvided, {
      error: 'El campo «tipo de cambio venta» es obligatorio.',
    }),
    source: optionalValue(
      z.string({ error: 'El campo «fuente» debe ser un texto.' }),
    ),
  });

  rateDate!: string;

  currencyCode!: string;

  buyRate!: number | string;

  sellRate!: number | string;

  source?: string | null;
}
