import { BadRequestException } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../shared/application/ports/business-reference.port';

/** Valida que el código exista en el catálogo de monedas activas. */
export async function assertActiveSaleCurrency(
  references: BusinessReferencePort,
  code: string | undefined | null,
): Promise<string> {
  const normalized = (code ?? 'PEN').trim().toUpperCase();
  if (!normalized) {
    throw new BadRequestException('Seleccione la moneda del precio de venta.');
  }
  const row = await references.currencyExists(normalized);
  if (!row) {
    throw new BadRequestException(`Moneda no válida o inactiva: ${normalized}`);
  }
  return normalized;
}
