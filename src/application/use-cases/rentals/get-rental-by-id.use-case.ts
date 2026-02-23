import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { RentalDetailData } from '../../repositories/rental.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class GetRentalByIdUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(id: string): Promise<RentalDetailData> {
    const rental = await this.rentalRepository.findById(id);
    if (!rental) {
      throw new EntityNotFoundException('Rental', id);
    }
    return rental;
  }
}
