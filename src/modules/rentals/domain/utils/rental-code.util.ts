import { dateOnlyYear } from '../../../../shared/domain/utils/peru-date.util';

/** Operación con la que empiezan los códigos descriptivos de Alquileres. */
export const RENTAL_CODE_OPERATION = 'ALQUILER';

/**
 * Código descriptivo del contrato: operación + año de inicio + código de la propiedad
 * (`ALQUILER-2026-CASA-EL BOSQUE-JIMÉNEZ`). Una renovación en otro año cambia el año sola;
 * propiedades con código antiguo quedan como `ALQUILER-2026-PROP-001`.
 */
export function buildRentalCode(
  propertyCode: string,
  startYear: number,
): string {
  return `${RENTAL_CODE_OPERATION}-${startYear}-${propertyCode.trim().toLocaleUpperCase('es-PE')}`;
}

/** Evita duplicados: `BASE`, `BASE-2`, `BASE-3`… según los códigos ya usados. */
export function withUniqueSuffix(
  base: string,
  usedCodes: readonly string[],
): string {
  const used = new Set(usedCodes);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Código de contratos anteriores a los códigos guardados (`ALQ-<año>-<6 últimos del id>`). */
export function legacyRentalCode(id: string, startDate: Date | string): string {
  const shortId = String(id).replace(/-/g, '').slice(-6).toUpperCase();
  return `ALQ-${dateOnlyYear(startDate)}-${shortId}`;
}
