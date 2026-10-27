import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertClientAddressLocation } from '../../../../crm/application/validators/client-address-location.validator';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { assertActiveSaleCurrency } from '../../../../ventas/application/validators/sale-currency.validator';
import { assertActiveCurrency } from '../../../../../shared/application/validation/currency.validator';
import type { Property } from '../../../domain/entities/property.entity';
import type {
  PropertyRepository,
  UpdatePropertyData,
} from '../../../domain/repositories/property.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { PROPERTY_REPOSITORY } from '../../../domain/repositories/property.repository';
import type { RentalRepository } from '../../../../rentals/domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../../../rentals/domain/repositories/rental.repository';
import type { VentasSalesRepository } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { VENTAS_SALES_REPOSITORY } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import {
  assertPropertyCurrencyChangeAllowed,
  assertVentasListingChangeAllowed,
} from '../../../../ventas/application/validators/sales-usage.validator';

const VENTAS_LISTING = new Set(['AVAILABLE', 'RESERVED', 'SOLD']);
const ALQUILERES_LISTING = new Set([
  'AVAILABLE',
  'RENTED',
  'EXPIRING',
  'MAINTENANCE',
]);

@Injectable()
export class UpdatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly references: BusinessReferencePort,
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(
    data: UpdatePropertyData,
    expectedApplicationSlug?: string,
  ): Promise<Property> {
    const existing = await this.propertyRepository.findById(data.id);
    if (!existing) {
      throw new NotFoundException(`Propiedad con id ${data.id} no encontrada`);
    }
    const app = await this.applicationRepository.findById(
      existing.applicationId,
    );
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new NotFoundException(
          `Propiedad con id ${data.id} no encontrada`,
        );
      }
    }
    const isVentas = app?.slug === 'ventas';
    const salesUsage = isVentas
      ? await this.ventasSales.getSalesUsage(existing.applicationId, {
          propertyId: data.id,
        })
      : null;
    if (data.listingStatus !== undefined && data.listingStatus !== null) {
      const ls = data.listingStatus;
      if (isVentas) {
        if (!VENTAS_LISTING.has(ls)) {
          throw new BadRequestException(
            'En Ventas el estado comercial debe ser AVAILABLE, RESERVED o SOLD.',
          );
        }
        assertVentasListingChangeAllowed(
          salesUsage!,
          existing.listingStatus ?? 'AVAILABLE',
          ls,
        );
      } else if (!ALQUILERES_LISTING.has(ls)) {
        throw new BadRequestException(
          'Estado de listado no válido para esta aplicación.',
        );
      }
    }
    const districtId = data.districtId ?? existing.districtId;
    const locationInput =
      data.locationCustom !== undefined
        ? data.locationCustom
        : existing.locationCustom;
    const locationCustom = assertClientAddressLocation(
      districtId,
      locationInput,
    );

    let saleCurrency: string | undefined;
    if (data.saleCurrency !== undefined) {
      saleCurrency = await assertActiveSaleCurrency(
        this.references,
        data.saleCurrency,
      );
      if (salesUsage && saleCurrency !== existing.saleCurrency) {
        assertPropertyCurrencyChangeAllowed(salesUsage);
      }
    }

    let rentCurrency: string | undefined;
    if (data.rentCurrency !== undefined) {
      rentCurrency = await assertActiveCurrency(
        this.references,
        data.rentCurrency,
      );
      // El contrato vigente fija la moneda del alquiler y de sus cuotas
      if (
        !isVentas &&
        rentCurrency !== existing.rentCurrency &&
        (await this.rentalRepository.countActiveByPropertyId(data.id)) > 0
      ) {
        throw new BadRequestException(
          'La propiedad tiene un contrato vigente: cambie la moneda desde el contrato de alquiler.',
        );
      }
    }

    let ownerPatch: Pick<UpdatePropertyData, 'ownerId' | 'ownerClientIds'> = {};
    if (data.ownerClientIds !== undefined || data.ownerId !== undefined) {
      const primary = data.ownerId ?? existing.ownerId;
      const ownerClientIds = Array.from(
        new Set(
          [
            primary,
            ...(data.ownerClientIds ?? existing.owners.map((o) => o.id)),
          ].filter(Boolean),
        ),
      );
      if (!ownerClientIds.length) {
        throw new BadRequestException('Debe indicar al menos un propietario.');
      }
      ownerPatch = { ownerId: ownerClientIds[0], ownerClientIds };
    }

    const updated = await this.propertyRepository.update({
      ...data,
      ...ownerPatch,
      ...(saleCurrency !== undefined ? { saleCurrency } : {}),
      ...(rentCurrency !== undefined ? { rentCurrency } : {}),
      ...(data.districtId !== undefined || data.locationCustom !== undefined
        ? { locationCustom }
        : {}),
    });
    // Precio, moneda o propietarios alimentan los procesos de venta en curso
    if (salesUsage && salesUsage.activeProcesses > 0) {
      await this.ventasSales.syncActiveProcessesWithProperty(
        data.id,
        existing.applicationId,
      );
    }
    return updated;
  }
}
