/** Convierte valores de form-data / query (`"true"`, `"false"`) a boolean. */
export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return Boolean(value);
}
