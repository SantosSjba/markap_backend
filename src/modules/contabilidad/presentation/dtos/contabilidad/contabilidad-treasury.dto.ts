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
  CreateBankAccountInput,
  CreateCashBoxInput,
  CreateTreasuryMovementInput,
  CreateTreasuryTransferInput,
  UpdateBankAccountInput,
  UpdateCashBoxInput,
  UpsertReconciliationInput,
} from '../../../domain/repositories/contabilidad-treasury.repository';

export class UpsertReconciliationDto implements UpsertReconciliationInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    bankAccountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta bancaria» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta bancaria» es obligatorio.',
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
    statementBalance: amountInput.refine(isProvided, {
      error: 'El campo «saldo del extracto» es obligatorio.',
    }),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  bankAccountId!: string;

  periodId!: string;

  statementBalance!: number | string;

  notes?: string | null;
}

export class CreateTreasuryTransferDto implements CreateTreasuryTransferInput {
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
    fromType: z
      .enum(['CASH', 'BANK'], {
        error: 'El campo «origen» no es una opción permitida.',
      })
      .refine(isProvided, { error: 'El campo «origen» es obligatorio.' }),
    fromCashBoxId: optionalValue(
      z.string({ error: 'El campo «caja de origen» debe ser un texto.' }),
    ),
    fromBankAccountId: optionalValue(
      z.string({
        error: 'El campo «cuenta bancaria de origen» debe ser un texto.',
      }),
    ),
    toType: z
      .enum(['CASH', 'BANK'], {
        error: 'El campo «destino» no es una opción permitida.',
      })
      .refine(isProvided, { error: 'El campo «destino» es obligatorio.' }),
    toCashBoxId: optionalValue(
      z.string({ error: 'El campo «caja de destino» debe ser un texto.' }),
    ),
    toBankAccountId: optionalValue(
      z.string({
        error: 'El campo «cuenta bancaria de destino» debe ser un texto.',
      }),
    ),
    amount: amountInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    movementDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha del movimiento» es obligatorio.',
    }),
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

  fromType!: 'CASH' | 'BANK';

  fromCashBoxId?: string | null;

  fromBankAccountId?: string | null;

  toType!: 'CASH' | 'BANK';

  toCashBoxId?: string | null;

  toBankAccountId?: string | null;

  amount!: number | string;

  movementDate!: string;

  description!: string;
}

export class CreateTreasuryMovementDto implements CreateTreasuryMovementInput {
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
    movementType: z
      .enum(['IN', 'OUT'], {
        error: 'El campo «tipo de movimiento» no es una opción permitida.',
      })
      .refine(isProvided, {
        error: 'El campo «tipo de movimiento» es obligatorio.',
      }),
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
    offsetAccountId: z.preprocess(
      primitiveText,
      z
        .string({
          error: 'El campo «cuenta de contrapartida» debe ser un texto.',
        })
        .refine(isProvided, {
          error: 'El campo «cuenta de contrapartida» es obligatorio.',
        }),
    ),
    amount: amountInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    foreignAmount: optionalValue(amountInput),
    exchangeRate: optionalValue(amountInput),
    movementDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «fecha del movimiento» es obligatorio.',
    }),
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

  movementType!: 'IN' | 'OUT';

  sourceType!: 'CASH' | 'BANK';

  cashBoxId?: string | null;

  bankAccountId?: string | null;

  offsetAccountId!: string;

  amount!: number | string;

  foreignAmount?: number | string | null;

  exchangeRate?: number | string | null;

  movementDate!: string;

  description!: string;
}

export class UpdateBankAccountDto implements UpdateBankAccountInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «código» debe ser un texto.' }),
      ),
    ),
    bankName: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «banco» debe ser un texto.' }),
      ),
    ),
    accountNumber: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «número de cuenta» debe ser un texto.' }),
      ),
    ),
    cci: optionalValue(
      z.string({ error: 'El campo «CCI» debe ser un texto.' }),
    ),
    currency: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    accountId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «cuenta contable» debe ser un texto.' }),
      ),
    ),
    isActive: optionalValue(booleanInput),
  });

  code?: string;

  bankName?: string;

  accountNumber?: string;

  cci?: string | null;

  currency?: string;

  accountId?: string;

  isActive?: boolean;
}

export class CreateBankAccountDto implements CreateBankAccountInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    bankName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «banco» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «banco» es obligatorio.' }),
    ),
    accountNumber: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «número de cuenta» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «número de cuenta» es obligatorio.',
        }),
    ),
    cci: optionalValue(
      z.string({ error: 'El campo «CCI» debe ser un texto.' }),
    ),
    currency: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    accountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta contable» es obligatorio.',
        }),
    ),
  });

  code!: string;

  bankName!: string;

  accountNumber!: string;

  cci?: string | null;

  currency?: string;

  accountId!: string;
}

export class UpdateCashBoxDto implements UpdateCashBoxInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «código» debe ser un texto.' }),
      ),
    ),
    name: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre» debe ser un texto.' }),
      ),
    ),
    accountId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «cuenta contable» debe ser un texto.' }),
      ),
    ),
    isActive: optionalValue(booleanInput),
  });

  code?: string;

  name?: string;

  accountId?: string;

  isActive?: boolean;
}

export class CreateCashBoxDto implements CreateCashBoxInput {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «nombre» es obligatorio.' }),
    ),
    accountId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «cuenta contable» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «cuenta contable» es obligatorio.',
        }),
    ),
  });

  code!: string;

  name!: string;

  accountId!: string;
}
