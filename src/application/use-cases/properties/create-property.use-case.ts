import { Injectable, Inject } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface CreatePropertyInput {
  applicationId?: string;
  applicationSlug?: string;
  code: string;
  propertyTypeId: string;
  addressLine: string;
  districtId: string;
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
}

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
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
    return this.propertyRepository.create({
      applicationId,
      code: input.code,
      propertyTypeId: input.propertyTypeId,
      addressLine: input.addressLine,
      districtId: input.districtId,
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
    });
  }
}
