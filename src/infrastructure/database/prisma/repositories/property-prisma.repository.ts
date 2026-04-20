import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PropertyPrismaMapper } from '../mappers/property-prisma.mapper';
import type {
  PropertyRepository,
  CreatePropertyData,
  UpdatePropertyData,
  ListPropertiesFilters,
  ListPropertiesResult,
} from '@domain/repositories/property.repository';
import { PropertyListItem, PropertyStats } from '@domain/entities/property.entity';
import type { Property } from '@domain/entities/property.entity';

@Injectable()
export class PropertyPrismaRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePropertyData): Promise<Property> {
    const createData: Prisma.PropertyCreateInput = {
      application: { connect: { id: data.applicationId } },
      code: data.code.trim(),
      propertyType: { connect: { id: data.propertyTypeId } },
      addressLine: data.addressLine.trim(),
      district: { connect: { id: data.districtId } },
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
      owner: { connect: { id: data.ownerId } },
      monthlyRent: data.monthlyRent ?? null,
      maintenanceAmount: data.maintenanceAmount ?? null,
      depositMonths: data.depositMonths ?? null,
      salePrice: data.salePrice ?? null,
      projectName: data.projectName?.trim() || null,
      listingStatus: data.listingStatus ?? null,
    };
    if (data.mediaItems !== undefined) {
      createData.mediaItems = PropertyPrismaMapper.mediaToJson(data.mediaItems) as Prisma.InputJsonValue;
    }

    const property = await this.prisma.property.create({
      data: createData,
    });
    const full = await this.findById(property.id);
    if (!full) throw new Error('Property create failed');
    return full;
  }

  async findById(id: string): Promise<Property | null> {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        district: {
          include: {
            province: {
              include: { department: true },
            },
          },
        },
      },
    });
    return property ? PropertyPrismaMapper.toDomain(property) : null;
  }

  async findMany(filters: ListPropertiesFilters): Promise<ListPropertiesResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app)
      return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const where: Prisma.PropertyWhereInput = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.propertyTypeId) where.propertyTypeId = filters.propertyTypeId;
    if (filters.districtId) where.districtId = filters.districtId;
    if (filters.listingStatus !== undefined && filters.listingStatus !== null)
      where.listingStatus = filters.listingStatus;
    if (filters.minSalePrice != null || filters.maxSalePrice != null) {
      where.salePrice = {};
      if (filters.minSalePrice != null) where.salePrice.gte = filters.minSalePrice;
      if (filters.maxSalePrice != null) where.salePrice.lte = filters.maxSalePrice;
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q } },
        { addressLine: { contains: q } },
        { projectName: { contains: q } },
        { owner: { fullName: { contains: q } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
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
      this.prisma.property.count({ where }),
    ]);

    const isVentasList = filters.applicationSlug === 'ventas';
    const propertyIds = data.map((p) => p.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeRentalPropertyIds = new Set<string>();
    const activeRentalEndByPropertyId = new Map<string, Date>();
    const activeRentalTenantByPropertyId = new Map<string, string | null>();
    if (!isVentasList && propertyIds.length > 0) {
      const rentals = await this.prisma.rental.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: 'ACTIVE',
          endDate: { gte: today },
          deletedAt: null,
        },
        select: { propertyId: true, endDate: true, tenant: { select: { fullName: true } } },
      });
      for (const r of rentals) {
        activeRentalPropertyIds.add(r.propertyId);
        const currentEnd = activeRentalEndByPropertyId.get(r.propertyId);
        if (!currentEnd || r.endDate > currentEnd) {
          activeRentalEndByPropertyId.set(r.propertyId, r.endDate);
          activeRentalTenantByPropertyId.set(r.propertyId, r.tenant?.fullName ?? null);
        }
      }
    }

    return {
      data: data.map(
        (p) =>
          new PropertyListItem(
            p.id,
            p.code,
            p.addressLine,
            p.district?.name ?? '',
            p.propertyType?.name ?? '',
            p.area,
            p.owner?.id ?? '',
            p.owner?.fullName ?? '',
            p.monthlyRent,
            p.salePrice,
            p.projectName,
            p.listingStatus,
            isVentasList ? false : activeRentalPropertyIds.has(p.id),
            isVentasList ? null : activeRentalEndByPropertyId.get(p.id) ?? null,
            isVentasList ? null : activeRentalTenantByPropertyId.get(p.id) ?? null,
          ),
      ),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<PropertyStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    const empty = new PropertyStats(0, 0, 0, 0, 0, 0, 0);
    if (!app) return empty;

    const baseWhere = { applicationId: app.id, deletedAt: null };

    if (applicationSlug === 'ventas') {
      const [total, available, reserved, sold] = await Promise.all([
        this.prisma.property.count({ where: baseWhere }),
        this.prisma.property.count({
          where: { ...baseWhere, listingStatus: 'AVAILABLE' },
        }),
        this.prisma.property.count({
          where: { ...baseWhere, listingStatus: 'RESERVED' },
        }),
        this.prisma.property.count({
          where: { ...baseWhere, listingStatus: 'SOLD' },
        }),
      ]);
      return new PropertyStats(total, 0, available, 0, 0, reserved, sold);
    }

    const [total, rented, available, expiring, maintenance] = await Promise.all([
      this.prisma.property.count({ where: baseWhere }),
      this.prisma.property.count({
        where: { ...baseWhere, listingStatus: 'RENTED' },
      }),
      this.prisma.property.count({
        where: { ...baseWhere, listingStatus: 'AVAILABLE' },
      }),
      this.prisma.property.count({
        where: { ...baseWhere, listingStatus: 'EXPIRING' },
      }),
      this.prisma.property.count({
        where: { ...baseWhere, listingStatus: 'MAINTENANCE' },
      }),
    ]);
    return new PropertyStats(total, rented, available, expiring, maintenance, 0, 0);
  }

  async update(data: UpdatePropertyData): Promise<Property> {
    const existing = await this.prisma.property.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Property not found');
      (err as { code?: string }).code = 'NOT_FOUND';
      throw err;
    }
    const updatePayload: Prisma.PropertyUpdateInput = {};
    if (data.code !== undefined) updatePayload.code = data.code.trim();
    if (data.propertyTypeId !== undefined)
      updatePayload.propertyType = { connect: { id: data.propertyTypeId } };
    if (data.addressLine !== undefined) updatePayload.addressLine = data.addressLine.trim();
    if (data.districtId !== undefined) updatePayload.district = { connect: { id: data.districtId } };
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
    if (data.ownerId !== undefined) updatePayload.owner = { connect: { id: data.ownerId } };
    if (data.monthlyRent !== undefined) updatePayload.monthlyRent = data.monthlyRent;
    if (data.maintenanceAmount !== undefined) updatePayload.maintenanceAmount = data.maintenanceAmount;
    if (data.depositMonths !== undefined) updatePayload.depositMonths = data.depositMonths;
    if (data.salePrice !== undefined) updatePayload.salePrice = data.salePrice;
    if (data.projectName !== undefined) updatePayload.projectName = data.projectName?.trim() || null;
    if (data.mediaItems !== undefined)
      updatePayload.mediaItems = PropertyPrismaMapper.mediaToJson(data.mediaItems) as Prisma.InputJsonValue;
    if (data.listingStatus !== undefined) updatePayload.listingStatus = data.listingStatus;

    await this.prisma.property.update({
      where: { id: data.id },
      data: updatePayload,
    });
    const full = await this.findById(data.id);
    if (!full) throw new Error('Property update failed');
    return full;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countActiveByOwnerId(ownerId: string, applicationId: string): Promise<number> {
    return this.prisma.property.count({
      where: { ownerId, applicationId, deletedAt: null },
    });
  }
}
