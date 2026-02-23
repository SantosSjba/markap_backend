import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { PropertyData } from '../../repositories/property.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class UpdatePropertyListingStatusUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(
    propertyId: string,
    listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE',
  ): Promise<PropertyData> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new EntityNotFoundException('Property', propertyId);
    }
    const activeCount = await this.rentalRepository.countActiveByPropertyId(
      propertyId,
    );
    if (activeCount === 0) {
      throw new BadRequestException(
        'Solo se puede cambiar el estado si la propiedad tiene un alquiler en vigencia.',
      );
    }
    return this.propertyRepository.update({
      id: propertyId,
      listingStatus,
    });
  }
}
