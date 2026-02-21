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
  isActive: boolean;
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
}

export interface PropertyRepository {
  create(data: CreatePropertyData): Promise<PropertyData>;
}

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');
