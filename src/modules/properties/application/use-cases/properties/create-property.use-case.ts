import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { assertClientAddressLocation } from '../../../../crm/application/validators/client-address-location.validator';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { assertActiveSaleCurrency } from '../../../../ventas/application/validators/sale-currency.validator';
import { assertActiveCurrency } from '../../../../../shared/application/validation/currency.validator';
import type { PropertyLocationCustom } from '../../../domain/entities/property.entity';
import type { PropertyRepository } from '../../../domain/repositories/property.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { PROPERTY_REPOSITORY } from '../../../domain/repositories/property.repository';

const VENTAS_LISTING = new Set(['AVAILABLE', 'RESERVED', 'SOLD']);
const ALQUILERES_LISTING = new Set([
  'AVAILABLE',
  'RENTED',
  'EXPIRING',
  'MAINTENANCE',
]);

export interface CreatePropertyInput {
  applicationId?: string;
  applicationSlug?: string;
  code: string;
  propertyTypeId: string;
  addressLine: string;
  districtId: string;
  locationCustom?: PropertyLocationCustom | null;
  description?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  ageYears?: number | null;
  floorLevel?: string | null;
  parkingSpaces?: number | null;
  partida1?: string | null;
  partida2?: string | null;
  partida3?: string | null;
  ownerId: string;
  ownerClientIds?: string[];
  monthlyRent?: number | null;
  rentCurrency?: string;
  maintenanceAmount?: number | null;
  depositMonths?: number | null;
  salePrice?: number | null;
  saleCurrency?: string;
  projectName?: string | null;
  mediaItems?: { url: string; kind: 'photo' | 'plan' }[] | null;
  listingStatus?: string | null;
}

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(input: CreatePropertyInput) {
    let applicationId = input.applicationId;
    if (!applicationId && input.applicationSlug) {
      const app = await this.applicationRepository.findBySlug(
        input.applicationSlug,
      );
      if (!app) {
        throw new EntityNotFoundException('Application', input.applicationSlug);
      }
      applicationId = app.id;
    }
    if (!applicationId) {
      throw new Error('Falta indicar la aplicación (applicationSlug).');
    }
    const app = await this.applicationRepository.findById(applicationId);
    if (!app) {
      throw new EntityNotFoundException('Application', applicationId);
    }

    const listingStatus = input.listingStatus?.trim() || 'AVAILABLE';
    if (app.slug === 'ventas') {
      if (!VENTAS_LISTING.has(listingStatus)) {
        throw new BadRequestException(
          'En Ventas el estado comercial debe ser AVAILABLE, RESERVED o SOLD.',
        );
      }
    } else if (!ALQUILERES_LISTING.has(listingStatus)) {
      throw new BadRequestException(
        'Estado de listado no válido para esta aplicación.',
      );
    }

    const locationCustom = assertClientAddressLocation(
      input.districtId,
      input.locationCustom,
    );

    const saleCurrency = await assertActiveSaleCurrency(
      this.references,
      input.saleCurrency,
    );
    const rentCurrency = await assertActiveCurrency(
      this.references,
      input.rentCurrency,
    );

    const ownerClientIds = Array.from(
      new Set([input.ownerId, ...(input.ownerClientIds ?? [])].filter(Boolean)),
    );
    if (!ownerClientIds.length) {
      throw new BadRequestException('Debe indicar al menos un propietario.');
    }

    return this.propertyRepository.create({
      applicationId,
      code: input.code,
      propertyTypeId: input.propertyTypeId,
      addressLine: input.addressLine,
      districtId: input.districtId,
      locationCustom,
      description: input.description,
      area: input.area,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      ageYears: input.ageYears,
      floorLevel: input.floorLevel,
      parkingSpaces: input.parkingSpaces,
      partida1: input.partida1,
      partida2: input.partida2,
      partida3: input.partida3,
      ownerId: ownerClientIds[0],
      ownerClientIds,
      monthlyRent: input.monthlyRent,
      rentCurrency,
      maintenanceAmount: input.maintenanceAmount,
      depositMonths: input.depositMonths,
      salePrice: input.salePrice,
      saleCurrency,
      projectName: input.projectName,
      mediaItems: input.mediaItems ?? undefined,
      listingStatus,
    });
  }
}
