import { BadRequestException } from '@nestjs/common';
import type { BusinessReferencePort } from '../ports/business-reference.port';

/** Valida responsables una sola vez por ID y siempre dentro de la aplicación. */
export async function assertAgentsBelongToApplication(
  references: BusinessReferencePort,
  applicationId: string,
  ids: (string | null | undefined)[],
): Promise<void> {
  const uniqueIds = [
    ...new Set(ids.filter((id): id is string => !!id?.trim())),
  ];
  for (const id of uniqueIds) {
    if (!(await references.agentExists(applicationId, id))) {
      throw new BadRequestException(
        `El responsable ${id} no existe o no pertenece a esta aplicación`,
      );
    }
  }
}
