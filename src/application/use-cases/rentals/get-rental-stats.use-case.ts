import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { RentalStats } from '../../repositories/rental.repository';

@Injectable()
export class GetRentalStatsUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(applicationSlug: string): Promise<RentalStats> {
    return this.rentalRepository.getStats(applicationSlug);
  }
}
