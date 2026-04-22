import type {
  ListPropertiesFilters,
  ListPropertiesResult,
  Property,
  PropertyStats,
  UpdatePropertyData,
} from '@domain/repositories/property.repository';
import type { CreatePropertyInput } from '../use-cases/properties/create-property.use-case';

export const PROPERTY_PORT = Symbol('PropertyPort');

export interface PropertyPort {
  listProperties(filters: ListPropertiesFilters): Promise<ListPropertiesResult>;
  getPropertyStats(applicationSlug: string): Promise<PropertyStats>;
  createProperty(input: CreatePropertyInput): Promise<Property>;
  getPropertyById(id: string, applicationSlug?: string): Promise<Property>;
  updateProperty(
    data: UpdatePropertyData,
    applicationSlug?: string,
  ): Promise<Property>;
  updateListingStatus(
    propertyId: string,
    listingStatus:
      | 'RENTED'
      | 'EXPIRING'
      | 'MAINTENANCE'
      | 'AVAILABLE'
      | 'RESERVED'
      | 'SOLD',
    applicationSlug?: string,
  ): Promise<Property>;
  deleteProperty(
    id: string,
    applicationSlug?: string,
  ): Promise<{ message: string }>;
}
