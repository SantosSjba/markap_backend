import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  PropertyRepository,
  PropertyData,
  CreatePropertyData,
} from '../../../../application/repositories/property.repository';

@Injectable()
export class PropertyPrismaRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePropertyData): Promise<PropertyData> {
    const property = await this.prisma.property.create({
      data: {
        applicationId: data.applicationId,
        code: data.code.trim(),
        propertyTypeId: data.propertyTypeId,
        addressLine: data.addressLine.trim(),
        districtId: data.districtId,
        description: data.description?.trim() || null,
        area: data.area ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        ageYears: data.ageYears ?? null,
        floorLevel: data.floorLevel?.trim() || null,
        parkingSpaces: data.parkingSpaces ?? null,
        partida1: data.partida1?.trim() || null,
        partida2: data.partida2?.trim() || null,
        partida3: data.partida3?.trim() || null,
        ownerId: data.ownerId,
        monthlyRent: data.monthlyRent ?? null,
        maintenanceAmount: data.maintenanceAmount ?? null,
        depositMonths: data.depositMonths ?? null,
      },
    });
    return this.toPropertyData(property);
  }

  private toPropertyData(property: {
    id: string;
    applicationId: string;
    code: string;
    propertyTypeId: string;
    addressLine: string;
    districtId: string;
    description: string | null;
    area: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    ageYears: number | null;
    floorLevel: string | null;
    parkingSpaces: number | null;
    partida1: string | null;
    partida2: string | null;
    partida3: string | null;
    ownerId: string;
    monthlyRent: number | null;
    maintenanceAmount: number | null;
    depositMonths: number | null;
    isActive: boolean;
  }): PropertyData {
    return {
      id: property.id,
      applicationId: property.applicationId,
      code: property.code,
      propertyTypeId: property.propertyTypeId,
      addressLine: property.addressLine,
      districtId: property.districtId,
      description: property.description,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      ageYears: property.ageYears,
      floorLevel: property.floorLevel,
      parkingSpaces: property.parkingSpaces,
      partida1: property.partida1,
      partida2: property.partida2,
      partida3: property.partida3,
      ownerId: property.ownerId,
      monthlyRent: property.monthlyRent,
      maintenanceAmount: property.maintenanceAmount,
      depositMonths: property.depositMonths,
      isActive: property.isActive,
    };
  }
}
