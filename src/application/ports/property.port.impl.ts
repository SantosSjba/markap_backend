import { Injectable } from '@nestjs/common';
import type {
  ListPropertiesFilters,
  ListPropertiesResult,
  Property,
  PropertyStats,
  UpdatePropertyData,
} from '@domain/repositories/property.repository';
import type { CreatePropertyInput } from '../use-cases/properties/create-property.use-case';
import { CreatePropertyUseCase } from '../use-cases/properties/create-property.use-case';
import { GetPropertyByIdUseCase } from '../use-cases/properties/get-property-by-id.use-case';
import { ListPropertiesUseCase } from '../use-cases/properties/list-properties.use-case';
import { GetPropertyStatsUseCase } from '../use-cases/properties/get-property-stats.use-case';
import { UpdatePropertyUseCase } from '../use-cases/properties/update-property.use-case';
import { UpdatePropertyListingStatusUseCase } from '../use-cases/properties/update-property-listing-status.use-case';
import { DeletePropertyUseCase } from '../use-cases/properties/delete-property.use-case';
import type { PropertyPort } from './property.port';

@Injectable()
export class PropertyPortImpl implements PropertyPort {
  constructor(
    private readonly createUc: CreatePropertyUseCase,
    private readonly getByIdUc: GetPropertyByIdUseCase,
    private readonly listUc: ListPropertiesUseCase,
    private readonly statsUc: GetPropertyStatsUseCase,
    private readonly updateUc: UpdatePropertyUseCase,
    private readonly listingUc: UpdatePropertyListingStatusUseCase,
    private readonly deleteUc: DeletePropertyUseCase,
  ) {}

  listProperties(filters: ListPropertiesFilters): Promise<ListPropertiesResult> {
    return this.listUc.execute(filters);
  }

  getPropertyStats(applicationSlug: string): Promise<PropertyStats> {
    return this.statsUc.execute(applicationSlug);
  }

  createProperty(input: CreatePropertyInput): Promise<Property> {
    return this.createUc.execute(input);
  }

  getPropertyById(id: string, applicationSlug?: string): Promise<Property> {
    return this.getByIdUc.execute(id, applicationSlug);
  }

  updateProperty(
    data: UpdatePropertyData,
    applicationSlug?: string,
  ): Promise<Property> {
    return this.updateUc.execute(data, applicationSlug);
  }

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
  ): Promise<Property> {
    return this.listingUc.execute(propertyId, listingStatus, applicationSlug);
  }

  deleteProperty(
    id: string,
    applicationSlug?: string,
  ): Promise<{ message: string }> {
    return this.deleteUc.execute(id, applicationSlug);
  }
}
