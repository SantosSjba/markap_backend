/** Texto de valores escalares procedentes de JSON; no convierte objetos en etiquetas. */
export function scalarText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  return '';
}
