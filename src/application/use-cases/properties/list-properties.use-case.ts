import { Injectable, Inject } from '@nestjs/common';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import { PROPERTY_REPOSITORY } from '@common/constants/injection-tokens';
import type { ListPropertiesFilters, ListPropertiesResult } from '@domain/repositories/property.repository';

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
