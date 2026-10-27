import { withUniqueSuffix } from '../../../rentals/domain/utils/rental-code.util';

/** Operación con la que empiezan los códigos descriptivos de Ventas (como `ALQUILER-…` en Alquileres). */
export const SALE_PROCESS_CODE_OPERATION = 'VENTA';

/**
 * Código descriptivo del proceso: operación + año de apertura + código del inmueble
 * (`VENTA-2026-CASA-CAYMA-TORRES`). Si el inmueble vuelve a venderse el mismo año
 * se agrega sufijo (`…-2`). Los procesos anteriores conservan su código `VNT-PRC-0001`.
 */
export function buildSaleProcessCode(
  propertyCode: string,
  year: number,
  usedCodes: readonly string[],
): string {
  const base = `${SALE_PROCESS_CODE_OPERATION}-${year}-${propertyCode.trim().toLocaleUpperCase('es-PE')}`;
  return withUniqueSuffix(base, usedCodes);
}
