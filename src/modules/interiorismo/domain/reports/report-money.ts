import { round2 } from '../budget/budget-sheet.calculator';
import type { ReportMoney } from '../entities/interior-reports.entity';

/** Agrupa sin convertir ni sumar monedas diferentes. */
export function reportMoney<T>(
  rows: readonly T[],
  currency: (row: T) => string,
  amount: (row: T) => number,
): ReportMoney[] {
  const sums = new Map<string, number>();
  for (const row of rows) {
    const value = amount(row);
    if (!Number.isFinite(value)) continue;
    const code = currency(row) || 'PEN';
    sums.set(code, (sums.get(code) ?? 0) + value);
  }
  return [...sums]
    .map(([currency, amount]) => ({ currency, amount: round2(amount) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
