import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  PropertyRepository,
  PropertyData,
  CreatePropertyData,
  UpdatePropertyData,
  ListPropertiesFilters,
  ListPropertiesResult,
  PropertyListItem,
  PropertyStats,
} from '@application/repositories/property.repository';

@Injectable()
export class PropertyPrismaRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePropertyData): Promise<PropertyData> {
    const property = await (this.prisma as any).property.create({
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
        listingStatus: data.listingStatus ?? null,
      },
    });
    return this.toPropertyData(property);
  }

  async findById(id: string): Promise<PropertyData | null> {
    const property = await (this.prisma as any).property.findFirst({
      where: { id, deletedAt: null },
    });
    return property ? this.toPropertyData(property) : null;
  }

  async findMany(filters: ListPropertiesFilters): Promise<ListPropertiesResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app)
      return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const where: Record<string, unknown> = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.propertyTypeId) where.propertyTypeId = filters.propertyTypeId;
    if (filters.listingStatus !== undefined && filters.listingStatus !== null)
      where.listingStatus = filters.listingStatus;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { addressLine: { contains: q, mode: 'insensitive' } },
        { owner: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).property.findMany({
        where,
        include: {
          owner: { select: { id: true, fullName: true } },
          district: { select: { name: true } },
          propertyType: { select: { name: true } },
        },
        orderBy: { code: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      (this.prisma as any).property.count({ where }),
    ]);

    const propertyIds = data.map((p: { id: string }) => p.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeRentalPropertyIds = new Set<string>();
    if (propertyIds.length > 0) {
      const rentals = await (this.prisma as any).rental.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: 'ACTIVE',
          endDate: { gte: today },
          deletedAt: null,
        },
        select: { propertyId: true },
      });
      for (const r of rentals as { propertyId: string }[]) {
        activeRentalPropertyIds.add(r.propertyId);
      }
    }

    return {
      data: data.map((p: { id: string; code: string; addressLine: string; district: { name: string }; propertyType: { name: string }; area: number | null; owner: { id: string; fullName: string }; monthlyRent: number | null; listingStatus: string | null }) => ({
        id: p.id,
        code: p.code,
        addressLine: p.addressLine,
        districtName: p.district?.name ?? '',
        propertyTypeName: p.propertyType?.name ?? '',
        area: p.area,
        ownerId: p.owner?.id ?? '',
        ownerFullName: p.owner?.fullName ?? '',
        monthlyRent: p.monthlyRent,
        listingStatus: p.listingStatus,
        hasActiveRental: activeRentalPropertyIds.has(p.id),
      })) as PropertyListItem[],
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<PropertyStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app)
      return { total: 0, rented: 0, available: 0, expiring: 0, maintenance: 0 };

    const baseWhere = { applicationId: app.id, deletedAt: null };
    const [total, rented, available, expiring, maintenance] = await Promise.all([
      (this.prisma as any).property.count({ where: baseWhere }),
      (this.prisma as any).property.count({
        where: { ...baseWhere, listingStatus: 'RENTED' },
      }),
      (this.prisma as any).property.count({
        where: { ...baseWhere, listingStatus: 'AVAILABLE' },
      }),
      (this.prisma as any).property.count({
        where: { ...baseWhere, listingStatus: 'EXPIRING' },
      }),
      (this.prisma as any).property.count({
        where: { ...baseWhere, listingStatus: 'MAINTENANCE' },
      }),
    ]);
    return { total, rented, available, expiring, maintenance };
  }

  async update(data: UpdatePropertyData): Promise<PropertyData> {
    const existing = await (this.prisma as any).property.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Property not found');
      (err as any).code = 'NOT_FOUND';
      throw err;
    }
    const updatePayload: Record<string, unknown> = {};
    if (data.code !== undefined) updatePayload.code = data.code.trim();
    if (data.propertyTypeId !== undefined) updatePayload.propertyTypeId = data.propertyTypeId;
    if (data.addressLine !== undefined) updatePayload.addressLine = data.addressLine.trim();
    if (data.districtId !== undefined) updatePayload.districtId = data.districtId;
    if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
    if (data.area !== undefined) updatePayload.area = data.area;
    if (data.bedrooms !== undefined) updatePayload.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) updatePayload.bathrooms = data.bathrooms;
    if (data.ageYears !== undefined) updatePayload.ageYears = data.ageYears;
    if (data.floorLevel !== undefined) updatePayload.floorLevel = data.floorLevel?.trim() || null;
    if (data.parkingSpaces !== undefined) updatePayload.parkingSpaces = data.parkingSpaces;
    if (data.partida1 !== undefined) updatePayload.partida1 = data.partida1?.trim() || null;
    if (data.partida2 !== undefined) updatePayload.partida2 = data.partida2?.trim() || null;
    if (data.partida3 !== undefined) updatePayload.partida3 = data.partida3?.trim() || null;
    if (data.ownerId !== undefined) updatePayload.ownerId = data.ownerId;
    if (data.monthlyRent !== undefined) updatePayload.monthlyRent = data.monthlyRent;
    if (data.maintenanceAmount !== undefined) updatePayload.maintenanceAmount = data.maintenanceAmount;
    if (data.depositMonths !== undefined) updatePayload.depositMonths = data.depositMonths;
    if (data.listingStatus !== undefined) updatePayload.listingStatus = data.listingStatus;

    const property = await (this.prisma as any).property.update({
      where: { id: data.id },
      data: updatePayload,
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
    listingStatus: string | null;
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
      listingStatus: property.listingStatus,
      isActive: property.isActive,
    };
  }
}
