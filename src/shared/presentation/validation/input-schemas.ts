import { z } from 'zod';

/** Convierte únicamente primitivas de formulario; objetos y listas no se convierten a texto. */
export function primitiveText(value: unknown): unknown {
  return typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
    ? String(value)
    : value;
}
export function numericValue(value: unknown): unknown {
  return typeof value === 'string' ? Number(value) : value;
}
/** No usa Boolean('false'), que devolvería true. */
export const booleanInput = z.preprocess((value: unknown) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());
export const numericInput = z.union([
  z.number(),
  z.string().refine((value) => /^-?\d+(?:[.,]\d+)?$/.test(value.trim()), {
    error: 'Debe ser un número válido.',
  }),
]);
export const amountInput = z.union(
  [
    z.number(),
    z.string().refine((value) => /^-?\d+(?:[.,]\d+)?$/.test(value.trim())),
  ],
  { error: 'Debe ser un importe numérico.' },
);
export const dateOnlyInput = z
  .string()
  .refine(
    (value) => z.iso.date().safeParse(value.trim().slice(0, 10)).success,
    { error: 'Debe ser una fecha válida (AAAA-MM-DD).' },
  );
export const isoDateInput = z.union([
  z.iso.date(),
  z.iso.datetime({ offset: true, local: true }),
]);
/** Mantiene los vacíos de formularios como en los contratos existentes. */
export function optionalValue<T extends z.ZodType>(schema: T) {
  return z.union([schema, z.literal(''), z.null()]).optional();
}
export function isProvided(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

export function hasNonBlankValue(value: unknown): boolean {
  return (
    value !== undefined &&
    value !== null &&
    (typeof value !== 'string' || value.trim() !== '')
  );
}

export const optionalBooleanInput = z.preprocess(
  (value: unknown) => (value === null || value === '' ? undefined : value),
  booleanInput.optional(),
);
