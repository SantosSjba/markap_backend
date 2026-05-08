export const INTERIOR_CATALOG_MATERIAL_REPOSITORY = Symbol('InteriorCatalogMaterialRepository');

export interface InteriorCatalogMaterialImageDto {
  id: string;
  sortOrder: number;
  url: string;
}

export interface InteriorCatalogMaterialListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  stock: number;
  imageCount: number;
  updatedAt: string;
}

export interface InteriorCatalogMaterialDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  stock: number;
  technicalSheetUrl: string | null;
  images: InteriorCatalogMaterialImageDto[];
  updatedAt: string;
}

export interface CreateInteriorCatalogMaterialPayload {
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  stock?: number;
  technicalSheetUrl?: string | null;
  imageUrls?: string[];
}

export interface UpdateInteriorCatalogMaterialPayload {
  name?: string;
  category?: string;
  brand?: string;
  unit?: string;
  price?: number;
  stock?: number;
  technicalSheetUrl?: string | null;
  /** Si se envía, reemplaza todas las imágenes por orden */
  imageUrls?: string[];
}

export interface ListInteriorCatalogMaterialsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface ListInteriorCatalogMaterialsResult {
  data: InteriorCatalogMaterialListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InteriorCatalogMaterialRepository {
  list(filters: ListInteriorCatalogMaterialsFilters): Promise<ListInteriorCatalogMaterialsResult>;
  findById(id: string, applicationSlug?: string): Promise<InteriorCatalogMaterialDetail | null>;
  create(
    applicationId: string,
    payload: CreateInteriorCatalogMaterialPayload,
  ): Promise<InteriorCatalogMaterialDetail>;
  update(id: string, payload: UpdateInteriorCatalogMaterialPayload): Promise<InteriorCatalogMaterialDetail>;
  delete(id: string): Promise<void>;
}
