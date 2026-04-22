import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import type { RentalDetail } from '@domain/repositories/rental.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { RENTAL_REPOSITORY } from '@common/constants/injection-tokens';

@Injectable()
export class GetRentalByIdUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(id: string): Promise<RentalDetail> {
    const rental = await this.rentalRepository.findById(id);
    if (!rental) {
      throw new EntityNotFoundException('Rental', id);
    }
    return rental;
  }
}
