import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { PropertyLocationCustom } from '@domain/entities/property.entity';
import { EntityNotFoundException } from '@domain/exceptions';
import { assertClientAddressLocation } from '@application/validators/client-address-location.validator';
import { assertActiveSaleCurrency } from '@application/validators/sale-currency.validator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

import { APPLICATION_REPOSITORY, PROPERTY_REPOSITORY } from '@common/constants/injection-tokens';

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
  monthlyRent?: number | null;
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
    private readonly prisma: PrismaService,
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
      throw new Error('applicationId or applicationSlug is required');
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

    const saleCurrency = await assertActiveSaleCurrency(this.prisma, input.saleCurrency);

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
      ownerId: input.ownerId,
      monthlyRent: input.monthlyRent,
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
