import { withUniqueSuffix } from '../../../rentals/domain/utils/rental-code.util';

/** Operación con la que empiezan los códigos de Interiorismo (como `VENTA-…` y `ALQUILER-…`). */
export const INTERIOR_PROJECT_CODE_OPERATION = 'PROYECTO';

const CODE_SEPARATOR = '-';

/** Etiquetas de los tipos de proyecto (la primera palabra va en el código). */
export const INTERIOR_PROJECT_TYPE_LABELS: Record<string, string> = {
  REMODELING: 'Remodelación',
  INTERIOR_DESIGN: 'Diseño interior',
  IMPLEMENTATION: 'Implementación',
  FURNITURE: 'Mobiliario',
};

/**
 * Apellido del cliente a partir de su nombre completo (no hay campo de apellido).
 * Personas («Nombres ApellidoPaterno ApellidoMaterno»): apellido paterno.
 * Empresas (RUC 20…): primera palabra de la razón social.
 */
export function suggestClientSurname(
  fullName: string,
  documentNumber?: string | null,
): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const isCompany = /^20\d{9}$/.test(documentNumber ?? '');
  if (isCompany || words.length === 1) return words[0];
  return words.length >= 3 ? words[words.length - 2] : words[1];
}

export interface InteriorProjectCodeParts {
  year: number;
  /** Etiqueta del tipo de proyecto; va su primera palabra («Diseño interior» → «DISEÑO») */
  typeLabel?: string | null;
  district?: string | null;
  clientSurname?: string | null;
}

/** Mayúsculas, espacios simples y sin el separador dentro de cada parte */
function normalizePart(value: string | null | undefined): string {
  return (value ?? '')
    .split(CODE_SEPARATOR)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('es-PE');
}

/**
 * Código descriptivo del proyecto: operación + año + tipo + distrito + apellido del cliente
 * (`PROYECTO-2026-DISEÑO-CAYMA-TORRES`). Partes vacías se omiten; si el código ya existe se
 * agrega sufijo (`…-2`). Los proyectos anteriores conservan su código `INT-PRY-0001`.
 */
export function buildInteriorProjectCode(
  parts: InteriorProjectCodeParts,
  usedCodes: readonly string[],
): string {
  const base = [
    INTERIOR_PROJECT_CODE_OPERATION,
    String(parts.year),
    normalizePart(parts.typeLabel).split(' ')[0] ?? '',
    normalizePart(parts.district),
    normalizePart(parts.clientSurname),
  ]
    .filter(Boolean)
    .join(CODE_SEPARATOR);
  return withUniqueSuffix(base, usedCodes);
}
