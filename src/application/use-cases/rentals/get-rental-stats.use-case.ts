import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '@domain/repositories/rental.repository';
import type { RentalStats } from '@domain/repositories/rental.repository';

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
