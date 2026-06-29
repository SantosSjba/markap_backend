import { roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';

export const FUNCTIONAL_CURRENCY = 'PEN';

export function normalizeCurrencyCode(code?: string | null): string {
  const normalized = code?.trim().toUpperCase();
  return normalized && normalized.length === 3 ? normalized : FUNCTIONAL_CURRENCY;
}

export function parseExchangeRate(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return NaN;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function convertForeignToPen(foreignAmount: number, exchangeRate: number): number {
  return roundPenAmount(foreignAmount * exchangeRate);
}

export function formatExchangeRate(value: number): string {
  return parseExchangeRate(value).toFixed(6);
}

export function assertPenAmountMatchesForeign(
  penAmount: number,
  foreignAmount: number,
  exchangeRate: number,
): void {
  const expected = convertForeignToPen(foreignAmount, exchangeRate);
  if (Math.abs(penAmount - expected) > 0.02) {
    throw new Error('El importe en soles no coincide con moneda extranjera × tipo de cambio');
  }
}
