export function roundPenAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parsePenAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return NaN;
  return roundPenAmount(n);
}

export function amountsBalanced(totalDebit: number, totalCredit: number): boolean {
  return Math.abs(roundPenAmount(totalDebit) - roundPenAmount(totalCredit)) < 0.005;
}

export function formatPenAmount(value: number): string {
  return roundPenAmount(value).toFixed(2);
}
