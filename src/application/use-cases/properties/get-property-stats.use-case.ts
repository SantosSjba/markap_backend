import { Injectable, Inject } from '@nestjs/common';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import type { PropertyStats } from '@domain/repositories/property.repository';

import { PROPERTY_REPOSITORY } from '@common/constants/injection-tokens';

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
