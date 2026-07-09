export const ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY = Symbol('ArquitecturaCatalogMaterialRepository');

export interface ArquitecturaCatalogMaterialImageDto {
  id: string;
  sortOrder: number;
  url: string;
}

export interface ArquitecturaCatalogMaterialListItem {
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

export interface ArquitecturaCatalogMaterialDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  stock: number;
  technicalSheetUrl: string | null;
  images: ArquitecturaCatalogMaterialImageDto[];
  updatedAt: string;
}

export interface CreateArquitecturaCatalogMaterialPayload {
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

export interface UpdateArquitecturaCatalogMaterialPayload {
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

export interface ListArquitecturaCatalogMaterialsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface ListArquitecturaCatalogMaterialsResult {
  data: ArquitecturaCatalogMaterialListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ArquitecturaCatalogMaterialRepository {
  list(filters: ListArquitecturaCatalogMaterialsFilters): Promise<ListArquitecturaCatalogMaterialsResult>;
  findById(id: string, applicationSlug?: string): Promise<ArquitecturaCatalogMaterialDetail | null>;
  create(
    applicationId: string,
    payload: CreateArquitecturaCatalogMaterialPayload,
  ): Promise<ArquitecturaCatalogMaterialDetail>;
  update(id: string, payload: UpdateArquitecturaCatalogMaterialPayload): Promise<ArquitecturaCatalogMaterialDetail>;
  delete(id: string): Promise<void>;
}
