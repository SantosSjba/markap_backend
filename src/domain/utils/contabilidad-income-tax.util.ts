import { CONTABILIDAD_DEFAULT_INCOME_TAX_RATE_PERCENT } from '@domain/constants/contabilidad-taxes.defaults';
import { roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';

export interface IncomeTaxAdjustmentAmounts {
  deductibleAdjustments: number;
  nonDeductibleAdjustments: number;
  otherIncomeAdjustments: number;
  otherExpenseAdjustments: number;
}

export function computeTaxableBase(
  netIncome: number,
  adjustments: IncomeTaxAdjustmentAmounts,
): number {
  const base =
    netIncome -
    adjustments.deductibleAdjustments +
    adjustments.nonDeductibleAdjustments +
    adjustments.otherIncomeAdjustments -
    adjustments.otherExpenseAdjustments;
  return roundPenAmount(base);
}

export function computeEstimatedIncomeTax(taxableBase: number, ratePercent = CONTABILIDAD_DEFAULT_INCOME_TAX_RATE_PERCENT): number {
  if (taxableBase <= 0) return 0;
  return roundPenAmount(taxableBase * (ratePercent / 100));
}

export function computeNetTaxBalance(
  estimatedTax: number,
  retentionsTotal: number,
  advancePaymentsTotal: number,
): number {
  return roundPenAmount(Math.max(0, estimatedTax - retentionsTotal - advancePaymentsTotal));
}
