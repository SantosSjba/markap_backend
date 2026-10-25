import { z } from 'zod';
import {
  amountInput,
  dateOnlyInput,
  isProvided,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

import type {
  ContabilidadJournalLineInput,
  CreateContabilidadJournalEntryInput,
  UpdateContabilidadJournalEntryInput,
} from '../../../domain/repositories/contabilidad-journal.repository';

export class ContabilidadJournalLineDto implements ContabilidadJournalLineInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    accountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta contable» es obligatorio.',
        }),
    ),
    debit: optionalValue(amountInput),
    credit: optionalValue(amountInput),
    foreignCurrency: optionalValue(
      z.string({ error: 'El campo «moneda extranjera» debe ser un texto.' }),
    ),
    foreignAmount: optionalValue(amountInput),
    exchangeRate: optionalValue(amountInput),
    costCenterId: optionalValue(
      z.string({ error: 'El campo «centro de costo» debe ser un texto.' }),
    ),
    auxiliaryRuc: optionalValue(
      z.string({ error: 'El campo «RUC auxiliar» debe ser un texto.' }),
    ),
    auxiliaryDoc: optionalValue(
      z.string({ error: 'El campo «documento auxiliar» debe ser un texto.' }),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
  });

  accountId!: string;

  debit?: number | string;

  credit?: number | string;

  foreignCurrency?: string | null;

  foreignAmount?: number | string | null;

  exchangeRate?: number | string | null;

  costCenterId?: string | null;

  auxiliaryRuc?: string | null;

  auxiliaryDoc?: string | null;

  description?: string | null;
}

export class UpdateContabilidadJournalEntryDto implements UpdateContabilidadJournalEntryInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    entryDate: optionalValue(dateOnlyInput),
    description: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «descripción» debe ser un texto.' }),
      ),
    ),
    lines: optionalValue(
      z.array(
        z.lazy(() => ContabilidadJournalLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      ),
    ),
  });

  entryDate?: string;

  description?: string;

  lines?: ContabilidadJournalLineInput[];
}

export class CreateContabilidadJournalEntryDto implements CreateContabilidadJournalEntryInput {
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
    entryDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha del asiento» es obligatorio.',
    }),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «descripción» es obligatorio.',
        }),
    ),
    lines: z
      .array(
        z.lazy(() => ContabilidadJournalLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «líneas» es obligatorio.' }),
  });

  periodId!: string;

  entryDate!: string;

  description!: string;

  lines!: ContabilidadJournalLineInput[];
}
