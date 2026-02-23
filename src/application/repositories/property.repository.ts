export interface PropertyData {
  id: string;
  applicationId: string;
  code: string;
  propertyTypeId: string;
  addressLine: string;
  districtId: string;
  description: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  ageYears: number | null;
  floorLevel: string | null;
  parkingSpaces: number | null;
  partida1: string | null;
  partida2: string | null;
  partida3: string | null;
  ownerId: string;
  monthlyRent: number | null;
  maintenanceAmount: number | null;
  depositMonths: number | null;
  listingStatus: string | null;
  isActive: boolean;
}

export interface PropertyListItem {
  id: string;
  code: string;
  addressLine: string;
  districtName: string;
  propertyTypeName: string;
  area: number | null;
  ownerId: string;
  ownerFullName: string;
  monthlyRent: number | null;
  listingStatus: string | null;
  /** true si tiene al menos un alquiler ACTIVE con endDate >= hoy (permite "Cambiar estado") */
  hasActiveRental: boolean;
}

export interface ListPropertiesFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  propertyTypeId?: string;
  listingStatus?: string | null;
}

export interface ListPropertiesResult {
  data: PropertyListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PropertyStats {
  total: number;
  rented: number;
  available: number;
  expiring: number;
  maintenance: number;
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
  listingStatus?: string | null;
}

export interface PropertyRepository {
  create(data: CreatePropertyData): Promise<PropertyData>;
  findById(id: string): Promise<PropertyData | null>;
  findMany(filters: ListPropertiesFilters): Promise<ListPropertiesResult>;
  getStats(applicationSlug: string): Promise<PropertyStats>;
  update(data: UpdatePropertyData): Promise<PropertyData>;
}

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');
