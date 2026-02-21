import { Injectable, Inject } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type {
  ListPropertiesFilters,
  ListPropertiesResult,
} from '../../repositories/property.repository';

@Injectable()
export class ListPropertiesUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(filters: ListPropertiesFilters): Promise<ListPropertiesResult> {
    return this.propertyRepository.findMany(filters);
  }
}
