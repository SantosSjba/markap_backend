import { BadRequestException } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../shared/application/ports/business-reference.port';

/** Valida que el id exista en el catálogo de medios de financiamiento activos. */
export async function assertActiveSaleFinancingChannel(
  references: BusinessReferencePort,
  id: string | undefined | null,
): Promise<string | null> {
  if (id === undefined) return undefined as unknown as string | null;
  if (id === null || !String(id).trim()) return null;
  const row = await references.findFinancingChannel(id.trim());
  if (!row) {
    throw new BadRequestException(
      'Medio de pago / banco no válido o inactivo.',
    );
  }
  return row.id;
}
