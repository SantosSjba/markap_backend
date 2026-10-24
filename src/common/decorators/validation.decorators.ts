import { Transform } from 'class-transformer';
import {
  ValidateBy,
  ValidateIf,
  type ValidationOptions,
} from 'class-validator';

/**
 * Campo opcional: se valida solo si trae un valor. A diferencia de
 * `@IsOptional()`, también acepta la cadena vacía que envían los formularios
 * cuando el usuario deja el campo en blanco.
 */
export function OptionalValue(): PropertyDecorator {
  return ValidateIf(
    (_object, value) => value !== undefined && value !== null && value !== '',
  );
}

const AMOUNT_RE = /^-?\d+(?:[.,]\d+)?$/;

/**
 * Importe enviado como número o como texto numérico ("1500.50" o "1500,50").
 * El servicio lo convierte después; aquí solo se rechaza lo que no es un número.
 */
export function IsAmount(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isAmount',
      validator: {
        validate: (value: unknown) =>
          (typeof value === 'number' && Number.isFinite(value)) ||
          (typeof value === 'string' && AMOUNT_RE.test(value.trim())),
        defaultMessage: () => '$property must be an amount',
      },
    },
    options,
  );
}

/** Fecha civil AAAA-MM-DD (se admite un ISO completo que empiece así). */
export function IsDateOnly(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDateOnly',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.trim()),
        defaultMessage: () => '$property must be a date (YYYY-MM-DD)',
      },
    },
    options,
  );
}

/** Número enviado como número o texto numérico (porcentajes, cantidades…). */
export function IsNumeric(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isNumeric',
      validator: {
        validate: (value: unknown) =>
          (typeof value === 'number' && Number.isFinite(value)) ||
          (typeof value === 'string' && AMOUNT_RE.test(value.trim())),
        defaultMessage: () => '$property must be a number',
      },
    },
    options,
  );
}

/**
 * Conserva el valor tal como llegó. La conversión implícita del ValidationPipe
 * convertiría '' en 0 o "false" en true; estos DTO solo validan, y la
 * conversión la hace el servicio como antes.
 */
export function KeepRaw(): PropertyDecorator {
  return Transform(
    ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key],
  );
}
