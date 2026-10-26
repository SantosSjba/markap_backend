export type FinancialValueType = 'PERCENT' | 'FIXED';

/** Configuración financiera de un alquiler (gastos, impuestos, comisiones). */
export class RentalFinancialConfig {
  constructor(
    public readonly id: string,
    public readonly rentalId: string,
    public readonly currency: string,
    public readonly baseAmount: number | null,
    public readonly expenseType: FinancialValueType,
    public readonly expenseValue: number,
    public readonly expenseDetail: string | null,
    public readonly expenseCurrency: string | null,
    public readonly taxType: FinancialValueType,
    public readonly taxValue: number,
    public readonly taxDetail: string | null,
    public readonly taxCurrency: string | null,
    public readonly externalAgentId: string | null,
    public readonly externalAgentType: FinancialValueType,
    public readonly externalAgentValue: number,
    public readonly externalAgentName: string | null,
    public readonly externalAgentCurrency: string | null,
    public readonly internalAgentId: string | null,
    public readonly internalAgentType: FinancialValueType,
    public readonly internalAgentValue: number,
    public readonly internalAgentName: string | null,
    public readonly internalAgentCurrency: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Moneda de cada concepto del desglose. */
export interface RentalFinancialLineCurrencies {
  base: string;
  expense: string;
  tax: string;
  externalAgentCommission: string;
  internalAgentCommission: string;
}

/** Totales del desglose en una moneda. */
export interface RentalFinancialCurrencyTotals {
  currency: string;
  income: number;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  utility: number;
}

/**
 * Desglose calculado a partir del contrato y la configuración financiera.
 * `utility` está en la moneda del contrato; `totalsByCurrency` resume cada moneda.
 */
export class RentalFinancialBreakdown {
  constructor(
    public readonly monthlyAmount: number,
    public readonly baseAmount: number,
    public readonly currency: string,
    public readonly expense: number,
    public readonly tax: number,
    public readonly externalAgentCommission: number,
    public readonly internalAgentCommission: number,
    public readonly utility: number,
    public readonly config: RentalFinancialConfig | null,
    public readonly lineCurrencies: RentalFinancialLineCurrencies,
    public readonly totalsByCurrency: RentalFinancialCurrencyTotals[],
  ) {}
}
