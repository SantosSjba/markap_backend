import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';
import type {
  BudgetRowFields,
  BudgetStatus,
} from '../../../domain/repositories/interior-project-budget.repository';
import type {
  BudgetIgvMode,
  BudgetMarginMode,
} from '../../../domain/budget/budget-sheet.calculator';

const text = (label: string, max: number) =>
  z
    .preprocess(
      primitiveText,
      z
        .string({ error: `El campo «${label}» debe ser un texto.` })
        .max(max, { error: `El campo «${label}» es demasiado largo.` }),
    )
    .nullish();

const amount = (label: string) =>
  z
    .preprocess(
      numericValue,
      z
        .number({ error: `El campo «${label}» debe ser un número válido.` })
        .min(0, { error: `El campo «${label}» no puede ser negativo.` }),
    )
    .nullish();

const pct = (label: string) =>
  z
    .preprocess(
      numericValue,
      z
        .number({ error: `El campo «${label}» debe ser un número válido.` })
        .min(0, { error: `El campo «${label}» no puede ser negativo.` })
        .max(1000, { error: `El campo «${label}» es demasiado alto.` }),
    )
    .nullish();

const uuidOrNull = (label: string) =>
  z
    .string({ error: `El campo «${label}» no es válido.` })
    .uuid({ error: `El campo «${label}» no es válido.` })
    .nullish();

/** Celdas de una fila de la hoja */
const rowFieldsShape = {
  kind: z
    .enum(['GROUP', 'ITEM', 'NOTE'], { error: 'El tipo de fila no es válido.' })
    .optional(),
  code: text('código', 40),
  description: text('descripción', 2000),
  unit: text('unidad', 20),
  quantity: amount('metrado'),
  unitPrice: amount('precio unitario'),
  directCost: amount('costo'),
  actualCost: amount('costo real'),
  utilityPctOverride: pct('utilidad %'),
  hasIgv: z.boolean({ error: 'El campo «IGV» debe ser sí o no.' }).optional(),
  supplierId: uuidOrNull('proveedor'),
  supplierName: text('proveedor', 200),
  status: z
    .enum(['PENDING', 'QUOTED', 'PURCHASED', 'GIFT'], {
      error: 'El estado de la partida no es válido.',
    })
    .optional(),
  note: text('nota', 2000),
};

export class UpdateBudgetHeaderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    number: text('número', 60),
    issuedAt: isoDateInput.nullish(),
    executionTerm: text('plazo', 200),
    executedBy: text('ejecuta', 200),
    status: z
      .enum(['DRAFT', 'SENT', 'APPROVED'], { error: 'El estado no es válido.' })
      .optional(),
    currency: z
      .enum(['PEN', 'USD', 'EUR'], { error: 'La moneda no es válida.' })
      .optional(),
    exchangeRate: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El tipo de cambio debe ser un número.' })
          .positive({ error: 'El tipo de cambio debe ser mayor que cero.' }),
      )
      .nullish(),
    exchangeRateDate: isoDateInput.nullish(),
    marginMode: z
      .enum(['PER_LINE', 'GLOBAL'], {
        error: 'El modo de margen no es válido.',
      })
      .optional(),
    utilityPct: pct('utilidad %'),
    overheadPct: pct('gastos generales %'),
    igvMode: z
      .enum(['PER_LINE', 'GLOBAL', 'NONE'], {
        error: 'El modo de IGV no es válido.',
      })
      .optional(),
    igvPct: pct('IGV %'),
    terms: text('condiciones', 5000),
    visibleColumns: z.array(z.string().max(40)).max(30).nullish(),
  });

  number?: string | null;
  issuedAt?: string | null;
  executionTerm?: string | null;
  executedBy?: string | null;
  status?: BudgetStatus;
  currency?: string;
  exchangeRate?: number | null;
  exchangeRateDate?: string | null;
  marginMode?: BudgetMarginMode;
  utilityPct?: number | null;
  overheadPct?: number | null;
  igvMode?: BudgetIgvMode;
  igvPct?: number | null;
  terms?: string | null;
  visibleColumns?: string[] | null;
}

export class CreateBudgetRowsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    parentId: uuidOrNull('grupo'),
    afterRowId: uuidOrNull('fila de referencia'),
    rows: z
      .array(z.strictObject(rowFieldsShape), {
        error: 'Las filas no son válidas.',
      })
      .min(1, { error: 'Agregue al menos una fila.' })
      .max(500, { error: 'Máximo 500 filas por vez.' }),
  });

  parentId?: string | null;
  afterRowId?: string | null;
  rows!: BudgetRowFields[];
}

export class UpdateBudgetRowDto implements BudgetRowFields {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject(rowFieldsShape);
}

export class MoveBudgetRowDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    parentId: uuidOrNull('grupo'),
    index: z.preprocess(
      numericValue,
      z.number({ error: 'La posición debe ser un número.' }).int().min(0),
    ),
  });

  parentId?: string | null;
  index!: number;
}

export class CreateBudgetSupplierPaymentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El monto debe ser un número.' })
        .positive({ error: 'El monto debe ser mayor que cero.' }),
    ),
    paidAt: isoDateInput,
    note: text('nota', 300),
  });

  amount!: number;
  paidAt!: string;
  note?: string | null;
}
