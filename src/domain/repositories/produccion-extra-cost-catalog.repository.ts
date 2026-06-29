export const PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY = Symbol('ProduccionExtraCostCatalogRepository');

export interface ProduccionExtraCostCatalogDto {
  id: string;
  name: string;
  defaultAmount: number;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateProduccionExtraCostCatalogPayload {
  name: string;
  defaultAmount: number;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateProduccionExtraCostCatalogPayload {
  name?: string;
  defaultAmount?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface ListProduccionExtraCostCatalogFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface ListProduccionExtraCostCatalogResult {
  data: ProduccionExtraCostCatalogDto[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionExtraCostCatalogRepository {
  list(filters: ListProduccionExtraCostCatalogFilters): Promise<ListProduccionExtraCostCatalogResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionExtraCostCatalogDto | null>;
  create(
    applicationId: string,
    payload: CreateProduccionExtraCostCatalogPayload,
  ): Promise<ProduccionExtraCostCatalogDto>;
  update(id: string, payload: UpdateProduccionExtraCostCatalogPayload): Promise<ProduccionExtraCostCatalogDto>;
  delete(id: string): Promise<void>;
}
