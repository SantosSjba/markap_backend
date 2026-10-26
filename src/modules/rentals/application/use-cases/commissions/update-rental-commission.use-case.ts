import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { Rental } from '../../../domain/entities/rental.entity';
import type { RentalRepository } from '../../../domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';
import {
  toRentalCommissionPatch,
  type RentalCommissionInput,
} from '../rentals/rental-commission-input';

/** Marca la comisión como pagada (con su fecha real) o pendiente, o cambia la fecha estimada. */
@Injectable()
export class UpdateRentalCommissionUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(
    rentalId: string,
    input: RentalCommissionInput,
  ): Promise<Rental> {
    const existing = await this.rentalRepository.findById(rentalId);
    if (!existing) throw new EntityNotFoundException('Rental', rentalId);
    return this.rentalRepository.update(rentalId, {
      commission: toRentalCommissionPatch(input),
    });
  }
}
