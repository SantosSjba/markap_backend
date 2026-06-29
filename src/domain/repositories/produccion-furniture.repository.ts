export const PRODUCCION_FURNITURE_REPOSITORY = Symbol('ProduccionFurnitureRepository');

export interface ProduccionFurnitureImageDto {
  id: string;
  sortOrder: number;
  url: string;
}

export interface ProduccionFurnitureBomLineDto {
  id: string;
  sortOrder: number;
  materialName: string;
  unit: string;
  quantity: number;
  unitCost: number | null;
  notes: string | null;
}

export interface ProduccionFurnitureBomLineInput {
  materialName: string;
  unit: string;
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
}

export interface ProduccionFurnitureListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  referencePrice: number;
  isActive: boolean;
  imageCount: number;
  bomLineCount: number;
  updatedAt: string;
}

export interface ProduccionFurnitureDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  referencePrice: number;
  technicalSheetUrl: string | null;
  notes: string | null;
  isActive: boolean;
  images: ProduccionFurnitureImageDto[];
  bomLines: ProduccionFurnitureBomLineDto[];
  updatedAt: string;
}

export interface CreateProduccionFurniturePayload {
  code: string;
  name: string;
  category: string;
  description?: string | null;
  widthCm?: number | null;
  depthCm?: number | null;
  heightCm?: number | null;
  referencePrice: number;
  technicalSheetUrl?: string | null;
  notes?: string | null;
  isActive?: boolean;
  imageUrls?: string[];
  bomLines?: ProduccionFurnitureBomLineInput[];
}

export interface UpdateProduccionFurniturePayload {
  name?: string;
  category?: string;
  description?: string | null;
  widthCm?: number | null;
  depthCm?: number | null;
  heightCm?: number | null;
  referencePrice?: number;
  technicalSheetUrl?: string | null;
  notes?: string | null;
  isActive?: boolean;
  imageUrls?: string[];
  bomLines?: ProduccionFurnitureBomLineInput[];
}

export interface ListProduccionFurnitureFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface ListProduccionFurnitureResult {
  data: ProduccionFurnitureListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionFurnitureStats {
  total: number;
  active: number;
  inactive: number;
}

export interface ProduccionFurnitureRepository {
  list(filters: ListProduccionFurnitureFilters): Promise<ListProduccionFurnitureResult>;
  getStats(applicationSlug: string): Promise<ProduccionFurnitureStats>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionFurnitureDetail | null>;
  create(
    applicationId: string,
    payload: CreateProduccionFurniturePayload,
  ): Promise<ProduccionFurnitureDetail>;
  update(id: string, payload: UpdateProduccionFurniturePayload): Promise<ProduccionFurnitureDetail>;
  delete(id: string): Promise<void>;
}
