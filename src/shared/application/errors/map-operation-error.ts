import { BadRequestException, HttpException } from '@nestjs/common';
import type { PersistenceErrorPort } from '../ports/persistence-error.port';

/** Conserva errores ya tipados para que el filtro HTTP aplique la misma política. */
export function mapOperationError(
  error: unknown,
  persistence: PersistenceErrorPort,
): never {
  if (error instanceof HttpException || persistence.isKnown(error)) throw error;
  throw new BadRequestException(
    error instanceof Error ? error.message : 'Operación no válida.',
  );
}
