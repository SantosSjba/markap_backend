import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { RentalRepository } from '../../../domain/repositories/rental.repository';

import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';

@Injectable()
export class CancelRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const rental = await this.rentalRepository.findById(id);
    if (!rental) throw new EntityNotFoundException('Rental', id);
    await this.rentalRepository.cancel(id);
    return { message: 'Contrato cancelado correctamente' };
  }
}
