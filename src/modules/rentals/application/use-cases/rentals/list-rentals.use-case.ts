import { Inject, Injectable } from '@nestjs/common';
import type {
  ListRentalsFilters,
  ListRentalsResult,
  RentalRepository,
} from '../../../domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';

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
