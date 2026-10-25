/** Normaliza valores numéricos, incluyendo objetos con conversión explícita. */
export function amountToNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { toNumber?: () => number }).toNumber === 'function'
  ) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}
