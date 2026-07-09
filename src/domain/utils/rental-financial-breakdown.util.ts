export interface RentalFinancialConfigCalcInput {
  baseAmount?: number | null;
  expenseType?: string;
  expenseValue?: number;
  taxType?: string;
  taxValue?: number;
  externalAgentType?: string;
  externalAgentValue?: number;
  internalAgentType?: string;
  internalAgentValue?: number;
}

export interface RentalFinancialBreakdownCalc {
  base: number;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  utility: number;
}

export function computeLineAmount(type: string, value: number, base: number): number {
  if (type === 'PERCENT') return Math.round((base * value) / 100 * 100) / 100;
  return Math.round(Number(value) * 100) / 100;
}

/**
 * Distribución financiera del alquiler:
 * - Gastos e impuestos: % sobre ingreso base (o monto fijo).
 * - Comisiones de agentes: % sobre (base − gastos − impuestos); montos fijos sin cambio.
 * - Utilidad neta: comisión neta de la inmobiliaria.
 */
export function computeRentalFinancialBreakdown(
  monthlyAmount: number,
  config: RentalFinancialConfigCalcInput | null | undefined,
): RentalFinancialBreakdownCalc {
  const base =
    config?.baseAmount != null && Number(config.baseAmount) > 0
      ? Number(config.baseAmount)
      : monthlyAmount;

  const expense = config
    ? computeLineAmount(config.expenseType ?? 'FIXED', Number(config.expenseValue ?? 0), base)
    : 0;
  const tax = config
    ? computeLineAmount(config.taxType ?? 'FIXED', Number(config.taxValue ?? 0), base)
    : 0;

  const commissionBase = Math.max(0, Math.round((base - expense - tax) * 100) / 100);

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

  const utility = Math.round(
    (base - expense - tax - externalAgentCommission - internalAgentCommission) * 100,
  ) / 100;

  return {
    base,
    expense,
    tax,
    externalAgentCommission,
    internalAgentCommission,
    utility,
  };
}
