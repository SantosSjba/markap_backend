import { Inject, Injectable } from '@nestjs/common';
import type { PropertyStats } from '../../../domain/entities/property.entity';
import type { PropertyRepository } from '../../../domain/repositories/property.repository';

import { PROPERTY_REPOSITORY } from '../../../domain/repositories/property.repository';

@Injectable()
export class GetPropertyStatsUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(applicationSlug: string): Promise<PropertyStats> {
    return this.propertyRepository.getStats(applicationSlug);
  }
}
