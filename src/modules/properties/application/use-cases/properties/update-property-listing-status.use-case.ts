import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { RentalRepository } from '../../../../rentals/domain/repositories/rental.repository';
import type { Property } from '../../../domain/entities/property.entity';
import type { PropertyRepository } from '../../../domain/repositories/property.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { RENTAL_REPOSITORY } from '../../../../rentals/domain/repositories/rental.repository';
import { PROPERTY_REPOSITORY } from '../../../domain/repositories/property.repository';
import type { VentasSalesRepository } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { VENTAS_SALES_REPOSITORY } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { assertVentasListingChangeAllowed } from '../../../../ventas/application/validators/sales-usage.validator';

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
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
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
    const app = await this.applicationRepository.findById(
      property.applicationId,
    );
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
      assertVentasListingChangeAllowed(
        await this.ventasSales.getSalesUsage(property.applicationId, {
          propertyId,
        }),
        property.listingStatus ?? 'AVAILABLE',
        listingStatus,
      );
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
    const activeCount =
      await this.rentalRepository.countActiveByPropertyId(propertyId);
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
