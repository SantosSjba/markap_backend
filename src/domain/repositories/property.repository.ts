import type {
  Property,
  PropertyListItem,
  PropertyMediaItem,
  PropertyStats,
} from '@domain/entities/property.entity';

export type { Property, PropertyListItem, PropertyMediaItem, PropertyStats } from '@domain/entities/property.entity';

export interface ListPropertiesFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  propertyTypeId?: string;
  districtId?: string;
  listingStatus?: string | null;
  minSalePrice?: number;
  maxSalePrice?: number;
}

export interface ListPropertiesResult {
  data: PropertyListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePropertyData {
  applicationId: string;
  code: string;
  propertyTypeId: string;
  addressLine: string;
  districtId: string;
  description?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  ageYears?: number | null;
  floorLevel?: string | null;
  parkingSpaces?: number | null;
  partida1?: string | null;
  partida2?: string | null;
  partida3?: string | null;
  ownerId: string;
  monthlyRent?: number | null;
  maintenanceAmount?: number | null;
  depositMonths?: number | null;
  salePrice?: number | null;
  projectName?: string | null;
  mediaItems?: PropertyMediaItem[] | null;
  listingStatus?: string | null;
}

export interface UpdatePropertyData {
  id: string;
  code?: string;
  propertyTypeId?: string;
  addressLine?: string;
  districtId?: string;
  description?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  ageYears?: number | null;
  floorLevel?: string | null;
  parkingSpaces?: number | null;
  partida1?: string | null;
  partida2?: string | null;
  partida3?: string | null;
  ownerId?: string;
  monthlyRent?: number | null;
  maintenanceAmount?: number | null;
  depositMonths?: number | null;
  salePrice?: number | null;
  projectName?: string | null;
  mediaItems?: PropertyMediaItem[] | null;
  listingStatus?: string | null;
}

export interface PropertyRepository {
  create(data: CreatePropertyData): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  findMany(filters: ListPropertiesFilters): Promise<ListPropertiesResult>;
  getStats(applicationSlug: string): Promise<PropertyStats>;
  update(data: UpdatePropertyData): Promise<Property>;
  softDelete(id: string): Promise<void>;
  countActiveByOwnerId(ownerId: string, applicationId: string): Promise<number>;
}

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');
