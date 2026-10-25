/** Normaliza enteros de URL antes de enviarlos al ORM. */
export function parseIntegerQuery(
  value: string | undefined,
  fallback: number,
  min = 1,
  max = 1_000_000,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  const number = Number.isSafeInteger(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, number));
}
