export interface RentalFinancialConfigCalcInput {
  baseAmount?: number | null;
  expenseType?: string;
  expenseValue?: number;
  expenseCurrency?: string | null;
  taxType?: string;
  taxValue?: number;
  taxCurrency?: string | null;
  externalAgentType?: string;
  externalAgentValue?: number;
  externalAgentCurrency?: string | null;
  internalAgentType?: string;
  internalAgentValue?: number;
  internalAgentCurrency?: string | null;
}

/** Totales de la distribución en una moneda (sin conversión entre monedas). */
export interface RentalFinancialCurrencyTotals {
  currency: string;
  income: number;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  utility: number;
}

export interface RentalFinancialBreakdownCalc {
  /** Montos de cada concepto, cada uno en su moneda (`currencies`) */
  base: number;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  /** Utilidad en la moneda del contrato (solo descuenta conceptos en esa moneda) */
  utility: number;
  currencies: {
    base: string;
    expense: string;
    tax: string;
    externalAgentCommission: string;
    internalAgentCommission: string;
  };
  /** Resumen por moneda; la del contrato va primero */
  totalsByCurrency: RentalFinancialCurrencyTotals[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeLineAmount(
  type: string,
  value: number,
  base: number,
): number {
  if (type === 'PERCENT') return round2((base * value) / 100);
  return round2(Number(value));
}

/** Los porcentajes se expresan en la moneda del contrato; los montos fijos, en la suya. */
function lineCurrency(
  type: string | undefined,
  currency: string | null | undefined,
  baseCurrency: string,
): string {
  return type === 'PERCENT' ? baseCurrency : currency || baseCurrency;
}

/**
 * Distribución financiera del alquiler:
 * - Gastos e impuestos: % sobre ingreso base (o monto fijo, en cualquier moneda).
 * - Comisiones de agentes: % sobre (base − gastos − impuestos en la moneda del contrato);
 *   montos fijos sin cambio, en su moneda.
 * - No hay conversión entre monedas: cada moneda tiene su propio total en `totalsByCurrency`.
 */
export function computeRentalFinancialBreakdown(
  monthlyAmount: number,
  config: RentalFinancialConfigCalcInput | null | undefined,
  baseCurrency = 'PEN',
): RentalFinancialBreakdownCalc {
  const base =
    config?.baseAmount != null && Number(config.baseAmount) > 0
      ? Number(config.baseAmount)
      : monthlyAmount;

  const currencies = {
    base: baseCurrency,
    expense: lineCurrency(
      config?.expenseType,
      config?.expenseCurrency,
      baseCurrency,
    ),
    tax: lineCurrency(config?.taxType, config?.taxCurrency, baseCurrency),
    externalAgentCommission: lineCurrency(
      config?.externalAgentType,
      config?.externalAgentCurrency,
      baseCurrency,
    ),
    internalAgentCommission: lineCurrency(
      config?.internalAgentType,
      config?.internalAgentCurrency,
      baseCurrency,
    ),
  };

  const expense = config
    ? computeLineAmount(
        config.expenseType ?? 'FIXED',
        Number(config.expenseValue ?? 0),
        base,
      )
    : 0;
  const tax = config
    ? computeLineAmount(
        config.taxType ?? 'FIXED',
        Number(config.taxValue ?? 0),
        base,
      )
    : 0;

  const inBase = (amount: number, currency: string) =>
    currency === baseCurrency ? amount : 0;
  const commissionBase = Math.max(
    0,
    round2(
      base - inBase(expense, currencies.expense) - inBase(tax, currencies.tax),
    ),
  );

  const externalAgentCommission = config
    ? computeLineAmount(
        config.externalAgentType ?? 'FIXED',
        Number(config.externalAgentValue ?? 0),
        commissionBase,
      )
    : 0;
  const internalAgentCommission = config
    ? computeLineAmount(
        config.internalAgentType ?? 'FIXED',
        Number(config.internalAgentValue ?? 0),
        commissionBase,
      )
    : 0;

  const totals = new Map<string, RentalFinancialCurrencyTotals>();
  const totalsFor = (currency: string) => {
    let row = totals.get(currency);
    if (!row) {
      row = {
        currency,
        income: 0,
        expense: 0,
        tax: 0,
        externalAgentCommission: 0,
        internalAgentCommission: 0,
        utility: 0,
      };
      totals.set(currency, row);
    }
    return row;
  };
  totalsFor(baseCurrency).income = base;
  totalsFor(currencies.expense).expense += expense;
  totalsFor(currencies.tax).tax += tax;
  totalsFor(currencies.externalAgentCommission).externalAgentCommission +=
    externalAgentCommission;
  totalsFor(currencies.internalAgentCommission).internalAgentCommission +=
    internalAgentCommission;

  const totalsByCurrency = [...totals.values()].map((row) => ({
    ...row,
    utility: round2(
      row.income -
        row.expense -
        row.tax -
        row.externalAgentCommission -
        row.internalAgentCommission,
    ),
  }));

  return {
    base,
    expense,
    tax,
    externalAgentCommission,
    internalAgentCommission,
    utility: totalsByCurrency[0].utility,
    currencies,
    totalsByCurrency,
  };
}
