import {
  computeRentalFinancialBreakdown,
  type RentalFinancialConfigCalcInput,
  type RentalFinancialCurrencyTotals,
} from './rental-financial-breakdown.util';

/** Estado del cobro de la comisión del alquiler (un solo pago). */
export const RENTAL_COMMISSION_STATUSES = ['PENDING', 'PAID'] as const;
export type RentalCommissionStatus =
  (typeof RENTAL_COMMISSION_STATUSES)[number];

export interface RentalCommissionState {
  commissionStatus: RentalCommissionStatus;
  commissionDueDate: Date | null;
  commissionPaidDate: Date | null;
}

/** Cambios pedidos; `undefined` conserva el valor actual. */
export interface RentalCommissionPatch {
  commissionStatus?: RentalCommissionStatus;
  commissionDueDate?: Date | null;
  commissionPaidDate?: Date | null;
}

/**
 * Estado resultante del cobro de la comisión:
 * - PAID exige la fecha efectiva de cobro (es la que ubica el ingreso en los reportes).
 * - Volver a PENDING borra la fecha de cobro.
 */
export function resolveRentalCommissionState(
  current: RentalCommissionState,
  patch: RentalCommissionPatch,
): RentalCommissionState {
  const status = patch.commissionStatus ?? current.commissionStatus;
  const dueDate =
    patch.commissionDueDate !== undefined
      ? patch.commissionDueDate
      : current.commissionDueDate;
  if (status === 'PENDING') {
    return {
      commissionStatus: status,
      commissionDueDate: dueDate,
      commissionPaidDate: null,
    };
  }
  const paidDate =
    patch.commissionPaidDate !== undefined
      ? patch.commissionPaidDate
      : current.commissionPaidDate;
  if (!paidDate) {
    throw new RangeError(
      'Indica la fecha de cobro para marcar la comisión como pagada.',
    );
  }
  return {
    commissionStatus: status,
    commissionDueDate: dueDate,
    commissionPaidDate: paidDate,
  };
}

export interface CollectedCommissionInput {
  monthlyAmount: number;
  currency: string;
  config: RentalFinancialConfigCalcInput | null | undefined;
}

export interface CollectedCommissionTotals extends RentalFinancialCurrencyTotals {
  /** Comisiones cobradas cuyo contrato está en esta moneda */
  collectedCommissions: number;
  /** Renta mensual de esos contratos */
  monthlyRent: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Suma la distribución financiera de las comisiones cobradas, separada por moneda
 * (sin conversión), en orden alfabético de moneda.
 */
export function sumCollectedCommissionsByCurrency(
  rentals: readonly CollectedCommissionInput[],
): CollectedCommissionTotals[] {
  const totals = new Map<string, CollectedCommissionTotals>();
  const rowFor = (currency: string) => {
    let row = totals.get(currency);
    if (!row) {
      row = {
        currency,
        collectedCommissions: 0,
        monthlyRent: 0,
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
  for (const rental of rentals) {
    const contract = rowFor(rental.currency);
    contract.collectedCommissions += 1;
    contract.monthlyRent += rental.monthlyAmount;
    const breakdown = computeRentalFinancialBreakdown(
      rental.monthlyAmount,
      rental.config,
      rental.currency,
    );
    for (const line of breakdown.totalsByCurrency) {
      const row = rowFor(line.currency);
      row.income += line.income;
      row.expense += line.expense;
      row.tax += line.tax;
      row.externalAgentCommission += line.externalAgentCommission;
      row.internalAgentCommission += line.internalAgentCommission;
      row.utility += line.utility;
    }
  }
  return [...totals.values()]
    .sort((a, b) => a.currency.localeCompare(b.currency))
    .map((row) => ({
      ...row,
      monthlyRent: round2(row.monthlyRent),
      income: round2(row.income),
      expense: round2(row.expense),
      tax: round2(row.tax),
      externalAgentCommission: round2(row.externalAgentCommission),
      internalAgentCommission: round2(row.internalAgentCommission),
      utility: round2(row.utility),
    }));
}
