import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  RentalRepository,
  RentalData,
  CreateRentalData,
  ListRentalsFilters,
  ListRentalsResult,
  RentalListItem,
  RentalStats,
  RentalDetailData,
  UpdateRentalData,
} from '@application/repositories/rental.repository';

@Injectable()
export class RentalPrismaRepository implements RentalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRentalData): Promise<RentalData> {
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
      },
    });
    return this.toRentalData(rental);
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
      data: data.map((r: any) => this.toListItem(r)),
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
      return { total: 0, vigentes: 0, porVencer: 0, vencidos: 0 };
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

    return { total, vigentes, porVencer, vencidos };
  }

  async findById(id: string): Promise<RentalDetailData | null> {
    const r = await (this.prisma as any).rental.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: { select: { id: true, code: true, addressLine: true, ownerId: true, owner: { select: { id: true, fullName: true } } } },
        tenant: { select: { id: true, fullName: true } },
        attachments: { select: { type: true } },
      },
    });
    if (!r) return null;
    const year = r.startDate instanceof Date ? r.startDate.getFullYear() : new Date(r.startDate).getFullYear();
    const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
    const contractCount = (r.attachments || []).filter((a: any) => a.type === 'CONTRACT').length;
    const deliveryCount = (r.attachments || []).filter((a: any) => a.type === 'DELIVERY_ACT').length;
    return {
      ...this.toRentalData(r),
      code: `ALQ-${year}-${shortId}`,
      property: {
        id: r.property.id,
        code: r.property.code,
        addressLine: r.property.addressLine,
        ownerId: r.property.ownerId,
        owner: { id: r.property.owner.id, fullName: r.property.owner.fullName },
      },
      tenant: { id: r.tenant.id, fullName: r.tenant.fullName },
      hasContract: contractCount > 0,
      hasDeliveryAct: deliveryCount > 0,
    };
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

  async update(id: string, data: UpdateRentalData): Promise<RentalData> {
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
      },
    });
    return this.toRentalData(r);
  }

  private toListItem(r: any): RentalListItem {
    const year = r.startDate instanceof Date ? r.startDate.getFullYear() : new Date(r.startDate).getFullYear();
    const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
    return {
      id: r.id,
      code: `ALQ-${year}-${shortId}`,
      propertyId: r.property.id,
      propertyAddress: r.property.addressLine,
      propertyCode: r.property.code,
      tenantId: r.tenant.id,
      tenantName: r.tenant.fullName,
      ownerId: r.property.owner.id,
      ownerName: r.property.owner.fullName,
      startDate: r.startDate,
      endDate: r.endDate,
      currency: r.currency,
      monthlyAmount: r.monthlyAmount,
      securityDeposit: r.securityDeposit,
      status: r.status,
      hasContract: Array.isArray(r.attachments) && r.attachments.length > 0,
    };
  }

  private toRentalData(r: {
    id: string;
    applicationId: string;
    propertyId: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    currency: string;
    monthlyAmount: number;
    securityDeposit: number | null;
    paymentDueDay: number;
    notes: string | null;
    status: string;
  }): RentalData {
    return {
      id: r.id,
      applicationId: r.applicationId,
      propertyId: r.propertyId,
      tenantId: r.tenantId,
      startDate: r.startDate,
      endDate: r.endDate,
      currency: r.currency,
      monthlyAmount: r.monthlyAmount,
      securityDeposit: r.securityDeposit,
      paymentDueDay: r.paymentDueDay,
      notes: r.notes,
      status: r.status,
    };
  }
}
