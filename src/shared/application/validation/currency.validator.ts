import { BadRequestException } from '@nestjs/common';
import { BusinessReferencePort } from '../ports/business-reference.port';

/**
 * Normaliza un código de moneda y valida que exista en el catálogo de monedas activas
 * (PEN, USD, EUR…). Sin código se usa `fallback`.
 */
export async function assertActiveCurrency(
  references: BusinessReferencePort,
  code: string | undefined | null,
  fallback = 'PEN',
): Promise<string> {
  const normalized = (code ?? fallback).trim().toUpperCase();
  if (!normalized) {
    throw new BadRequestException('Seleccione la moneda.');
  }
  if (!(await references.currencyExists(normalized))) {
    throw new BadRequestException(`Moneda no válida o inactiva: ${normalized}`);
  }
  return normalized;
}
