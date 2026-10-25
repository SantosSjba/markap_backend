import { safeFilename } from './safe-filename.util';

export type StorageObjectKeyParams = {
  applicationSlug: string;
  module: string;
  entityType: string;
  entityId: string;
  category?: string;
  originalFileName?: string;
};

/**
 * Estructura en MinIO:
 * {app}/{modulo}/{tipo-entidad}/{entidad-id}/{categoria}/{timestamp}_{archivo}
 * Ej: alquileres/rentals/rental/abc-123/CONTRACT/1734567890_contrato.pdf
 */
export function buildStorageObjectKey(params: StorageObjectKeyParams): string {
  const slug = params.applicationSlug.trim().toLowerCase();
  const module = params.module.trim().toLowerCase();
  const entityType = params.entityType.trim().toLowerCase();
  const entityId = params.entityId.trim();
  const category = (params.category?.trim() || 'general').toLowerCase();
  const name = safeFilename(params.originalFileName);
  return `${slug}/${module}/${entityType}/${entityId}/${category}/${Date.now()}_${name}`;
}
