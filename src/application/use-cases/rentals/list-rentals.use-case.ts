import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type {
  ListRentalsFilters,
  ListRentalsResult,
} from '../../repositories/rental.repository';

@Injectable()
export class ListRentalsUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(filters: ListRentalsFilters): Promise<ListRentalsResult> {
    return this.rentalRepository.findMany(filters);
  }
}
