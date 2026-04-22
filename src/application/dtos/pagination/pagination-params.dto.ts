/**
 * Parámetros de paginación reutilizables en la capa de aplicación
 * (pueden mapearse desde query HTTP o mensajes de cola).
 */
export interface PaginationParams {
  page: number;
  limit: number;
}
