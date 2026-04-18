import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeletePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new EntityNotFoundException('Property', id);
    const activeRentals = await this.rentalRepository.countActiveByPropertyId(id);
    if (activeRentals > 0) {
      throw new BadRequestException(
        'No se puede eliminar la propiedad mientras tenga un contrato de alquiler vigente.',
      );
    }
    await this.propertyRepository.softDelete(id);
    return { message: 'Propiedad eliminada correctamente' };
  }
}
