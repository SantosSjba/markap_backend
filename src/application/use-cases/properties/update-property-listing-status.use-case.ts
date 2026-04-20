import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import { PROPERTY_REPOSITORY } from '@domain/repositories/property.repository';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '@domain/repositories/rental.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '@domain/repositories/application.repository';
import type { Property } from '@domain/repositories/property.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const VENTAS_LISTING = new Set(['AVAILABLE', 'RESERVED', 'SOLD']);
const ALQUILERES_LISTING_MODAL = new Set(['RENTED', 'EXPIRING', 'MAINTENANCE']);

@Injectable()
export class UpdatePropertyListingStatusUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    propertyId: string,
    listingStatus:
      | 'RENTED'
      | 'EXPIRING'
      | 'MAINTENANCE'
      | 'AVAILABLE'
      | 'RESERVED'
      | 'SOLD',
    expectedApplicationSlug?: string,
  ): Promise<Property> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new EntityNotFoundException('Property', propertyId);
    }
    const app = await this.applicationRepository.findById(property.applicationId);
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Property', propertyId);
      }
    }
    const slug = app?.slug ?? '';

    if (slug === 'ventas') {
      if (!VENTAS_LISTING.has(listingStatus)) {
        throw new BadRequestException(
          'En Ventas el estado debe ser Disponible (AVAILABLE), Separada (RESERVED) o Vendida (SOLD).',
        );
      }
      return this.propertyRepository.update({
        id: propertyId,
        listingStatus,
      });
    }

    if (!ALQUILERES_LISTING_MODAL.has(listingStatus)) {
      throw new BadRequestException(
        'En Alquileres solo se puede fijar Alquilada, Por vencer o En mantenimiento desde este endpoint.',
      );
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
