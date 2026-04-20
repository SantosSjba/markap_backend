import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RentalPrismaMapper } from '../mappers/rental-prisma.mapper';
import type {
  RentalRepository,
  CreateRentalData,
  ListRentalsFilters,
  ListRentalsResult,
  UpdateRentalData,
} from '@domain/repositories/rental.repository';
import { RentalAttachment, RentalDetail, RentalStats } from '@domain/entities/rental.entity';
import type { Rental } from '@domain/entities/rental.entity';

@Injectable()
export class RentalPrismaRepository implements RentalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRentalData): Promise<Rental> {
    const rental = await (this.prisma as any).rental.create({
      data: {
        applicationId: data.applicationId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        currency: data.currency,
        monthlyAmount: data.monthlyAmount,
        securityDeposit: data.securityDeposit ?? null,
        paymentDueDay: data.paymentDueDay,
        notes: data.notes?.trim() || null,
        enableAlerts: data.enableAlerts ?? true,
      },
    });
    return RentalPrismaMapper.toDomain(rental);
  }

  async findMany(filters: ListRentalsFilters): Promise<ListRentalsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const where: any = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search?.trim()) {
      where.OR = [
        { property: { code: { contains: filters.search.trim() } } },
        { property: { addressLine: { contains: filters.search.trim() } } },
        { tenant: { fullName: { contains: filters.search.trim() } } },
        { property: { owner: { fullName: { contains: filters.search.trim() } } } },
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).rental.findMany({
        where,
        include: {
          property: { select: { id: true, code: true, addressLine: true, ownerId: true, owner: { select: { id: true, fullName: true } } } },
          tenant: { select: { id: true, fullName: true } },
          attachments: { where: { type: 'CONTRACT' }, select: { id: true } },
        },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      (this.prisma as any).rental.count({ where }),
    ]);

    return {
      data: data.map((r: any) => RentalPrismaMapper.toListItem(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<RentalStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new RentalStats(0, 0, 0, 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const baseWhere = { applicationId: app.id, deletedAt: null };

    const [total, vigentes, porVencer, vencidos] = await Promise.all([
      (this.prisma as any).rental.count({ where: baseWhere }),
      (this.prisma as any).rental.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      (this.prisma as any).rental.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE',
          endDate: { gte: today, lte: in30Days },
        },
      }),
      (this.prisma as any).rental.count({
        where: {
          ...baseWhere,
          OR: [{ endDate: { lt: today } }, { status: 'EXPIRED' }],
        },
      }),
    ]);

    return new RentalStats(total, vigentes, porVencer, vencidos);
  }

  async findById(id: string): Promise<RentalDetail | null> {
    const r = await (this.prisma as any).rental.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: { select: { id: true, code: true, addressLine: true, ownerId: true, owner: { select: { id: true, fullName: true } } } },
        tenant: { select: { id: true, fullName: true } },
        attachments: { select: { id: true, type: true, filePath: true, originalFileName: true }, orderBy: { id: 'asc' } },
      },
    });
    if (!r) return null;
    const year = r.startDate instanceof Date ? r.startDate.getFullYear() : new Date(r.startDate).getFullYear();
    const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
    const attachments: Array<{ id: string; type: string; filePath: string; originalFileName: string }> = r.attachments || [];
    const contractCount = attachments.filter((a) => a.type === 'CONTRACT').length;
    const deliveryCount = attachments.filter((a) => a.type === 'DELIVERY_ACT').length;
    const base = RentalPrismaMapper.toDomain(r);
    return new RentalDetail(
      base,
      `ALQ-${year}-${shortId}`,
      {
        id: r.property.id,
        code: r.property.code,
        addressLine: r.property.addressLine,
        ownerId: r.property.ownerId,
        owner: { id: r.property.owner.id, fullName: r.property.owner.fullName },
      },
      { id: r.tenant.id, fullName: r.tenant.fullName },
      contractCount > 0,
      deliveryCount > 0,
      attachments.map(
        (a) => new RentalAttachment(a.id, a.type, a.filePath, a.originalFileName),
      ),
    );
  }

  async countActiveByPropertyId(propertyId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (this.prisma as any).rental.count({
      where: {
        propertyId,
        status: 'ACTIVE',
        endDate: { gte: today },
        deletedAt: null,
      },
    });
  }

  async countActiveInvolvingClient(clientId: string, applicationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeRental = {
      status: 'ACTIVE',
      endDate: { gte: today },
      deletedAt: null,
      applicationId,
    };
    return (this.prisma as any).rental.count({
      where: {
        ...activeRental,
        OR: [
          { tenantId: clientId },
          {
            property: {
              ownerId: clientId,
              deletedAt: null,
              applicationId,
            },
          },
        ],
      },
    });
  }

  async update(id: string, data: UpdateRentalData): Promise<Rental> {
    const r = await (this.prisma as any).rental.update({
      where: { id },
      data: {
        ...(data.startDate != null && { startDate: data.startDate }),
        ...(data.endDate != null && { endDate: data.endDate }),
        ...(data.currency != null && { currency: data.currency }),
        ...(data.monthlyAmount != null && { monthlyAmount: data.monthlyAmount }),
        ...(data.securityDeposit !== undefined && { securityDeposit: data.securityDeposit }),
        ...(data.paymentDueDay != null && { paymentDueDay: data.paymentDueDay }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.status != null && { status: data.status }),
        ...(data.enableAlerts !== undefined && { enableAlerts: data.enableAlerts }),
      },
    });
    return RentalPrismaMapper.toDomain(r);
  }

  async cancel(id: string): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: { status: 'CANCELLED', deletedAt: new Date() },
    });
  }
}
