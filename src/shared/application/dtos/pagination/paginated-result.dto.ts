/**
 * Resultado paginado genérico en la capa de aplicación.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
