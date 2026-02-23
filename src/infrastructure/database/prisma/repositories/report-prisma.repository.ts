import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  ReportRepository,
  ReportsSummary,
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  ContractStatusSummary,
  MonthlyMetrics,
  RentalsByMonthItem,
} from '@application/repositories/report.repository';

@Injectable()
export class ReportPrismaRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(applicationSlug: string, days: number): Promise<ReportsSummary> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return {
        contratosPorVencer: 0,
        propiedadesSinContrato: 0,
        clientesActivos: 0,
        clientesConIncidencias: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endRange = new Date(today);
    endRange.setDate(endRange.getDate() + days);

    const [contratosPorVencer, propiedadesSinContrato, clientesActivos] = await Promise.all([
      (this.prisma as any).rental.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          status: 'ACTIVE',
          endDate: { gte: today, lte: endRange },
        },
      }),
      this.countPropertiesWithoutContract(app.id),
      this.countActiveTenants(app.id),
    ]);

    return {
      contratosPorVencer,
      propiedadesSinContrato,
      clientesActivos,
      clientesConIncidencias: 0,
    };
  }

  async getContractsExpiring(
    applicationSlug: string,
    days: number,
  ): Promise<ContractExpiringItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endRange = new Date(today);
    endRange.setDate(endRange.getDate() + days);

    const rentals = await (this.prisma as any).rental.findMany({
      where: {
        applicationId: app.id,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today, lte: endRange },
      },
      include: {
        property: {
          select: {
            addressLine: true,
            owner: { select: { fullName: true } },
          },
        },
        tenant: { select: { fullName: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    return rentals.map((r: any) => {
      const endDate = new Date(r.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const year = endDate.getFullYear();
      const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
      return {
        id: r.id,
        code: `ALQ-${year}-${shortId}`,
        tenantName: r.tenant.fullName,
        propertyAddress: r.property.addressLine,
        ownerName: r.property.owner.fullName,
        endDate: r.endDate,
        daysLeft,
      };
    });
  }

  async getPropertiesWithoutContract(
    applicationSlug: string,
  ): Promise<PropertyWithoutContractItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const propertiesWithActiveRental = await (this.prisma as any).rental.findMany({
      where: {
        applicationId: app.id,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
      select: { propertyId: true },
      distinct: ['propertyId'],
    });
    const idsWithRental = new Set(propertiesWithActiveRental.map((r: any) => r.propertyId));

    const properties = await (this.prisma as any).property.findMany({
      where: {
        applicationId: app.id,
        deletedAt: null,
        isActive: true,
        id: { notIn: Array.from(idsWithRental) },
      },
      include: {
        owner: { select: { fullName: true } },
      },
      orderBy: { code: 'asc' },
    });

    return properties.map((p: any) => ({
      id: p.id,
      code: p.code,
      addressLine: p.addressLine,
      ownerName: p.owner.fullName,
    }));
  }

  async getActiveClients(applicationSlug: string): Promise<ActiveClientReportItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tenantsWithActive = await (this.prisma as any).rental.groupBy({
      by: ['tenantId'],
      where: {
        applicationId: app.id,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
      _count: { id: true },
    });

    if (tenantsWithActive.length === 0) return [];

    const tenantIds = tenantsWithActive.map((g: any) => g.tenantId);
    const clients = await (this.prisma as any).client.findMany({
      where: { id: { in: tenantIds }, deletedAt: null },
      select: { id: true, fullName: true },
    });
    const countByTenant = Object.fromEntries(
      tenantsWithActive.map((g: any) => [g.tenantId, g._count.id]),
    );

    return clients.map((c: any) => ({
      id: c.id,
      fullName: c.fullName,
      contractsCount: countByTenant[c.id] ?? 0,
    }));
  }

  async getContractStatusSummary(
    applicationSlug: string,
  ): Promise<ContractStatusSummary> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return { vigentes: 0, porVencer: 0, proximos: 0, urgentes: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day90 = new Date(today);
    day90.setDate(day90.getDate() + 90);
    const day60 = new Date(today);
    day60.setDate(day60.getDate() + 60);
    const day30 = new Date(today);
    day30.setDate(day30.getDate() + 30);

    const baseWhere = {
      applicationId: app.id,
      deletedAt: null,
      status: 'ACTIVE',
      endDate: { gte: today },
    };

    const [vigentes, porVencer, proximos, urgentes] = await Promise.all([
      (this.prisma as any).rental.count({
        where: { ...baseWhere, endDate: { gt: day90 } },
      }),
      (this.prisma as any).rental.count({
        where: { ...baseWhere, endDate: { gte: day60, lte: day90 } },
      }),
      (this.prisma as any).rental.count({
        where: { ...baseWhere, endDate: { gte: day30, lt: day60 } },
      }),
      (this.prisma as any).rental.count({
        where: { ...baseWhere, endDate: { gte: today, lte: day30 } },
      }),
    ]);

    return { vigentes, porVencer, proximos, urgentes };
  }

  async getMonthlyMetrics(applicationSlug: string): Promise<MonthlyMetrics> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return {
        tasaOcupacion: 0,
        tasaCobranza: 0,
        contratosRenovados: 0,
        clientesNuevos: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalProps, rentedCount, newClientsThisMonth] = await Promise.all([
      (this.prisma as any).property.count({
        where: { applicationId: app.id, deletedAt: null, isActive: true },
      }),
      (this.prisma as any).rental.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          status: 'ACTIVE',
          endDate: { gte: today },
        },
      }),
      (this.prisma as any).client.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          clientType: 'TENANT',
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const tasaOcupacion = totalProps > 0 ? Math.round((rentedCount / totalProps) * 100) : 0;

    return {
      tasaOcupacion,
      tasaCobranza: 0,
      contratosRenovados: 0,
      clientesNuevos: newClientsThisMonth,
    };
  }

  async getRentalsByMonth(
    applicationSlug: string,
    year: number,
  ): Promise<RentalsByMonthItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const result: RentalsByMonthItem[] = [];

    for (let month = 1; month <= 12; month++) {
      const firstDay = new Date(year, month - 1, 1);
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(year, month, 0);
      lastDay.setHours(23, 59, 59, 999);

      const baseWhere = {
        applicationId: app.id,
        deletedAt: null,
      };

      const [newContracts, expiredContracts, activeAtEnd, revenueRentals] =
        await Promise.all([
          (this.prisma as any).rental.count({
            where: {
              ...baseWhere,
              startDate: { gte: firstDay, lte: lastDay },
            },
          }),
          (this.prisma as any).rental.count({
            where: {
              ...baseWhere,
              endDate: { gte: firstDay, lte: lastDay },
            },
          }),
          (this.prisma as any).rental.count({
            where: {
              ...baseWhere,
              status: 'ACTIVE',
              startDate: { lte: lastDay },
              endDate: { gte: lastDay },
            },
          }),
          (this.prisma as any).rental.findMany({
            where: {
              ...baseWhere,
              startDate: { lte: lastDay },
              endDate: { gte: firstDay },
            },
            select: { monthlyAmount: true, currency: true },
          }),
        ]);

      const totalRevenue = revenueRentals.reduce(
        (sum: number, r: any) => sum + Number(r.monthlyAmount || 0),
        0,
      );
      const currency =
        revenueRentals.length > 0
          ? (revenueRentals[0] as any).currency || 'PEN'
          : 'PEN';

      result.push({
        month,
        year,
        monthName: monthNames[month - 1],
        newContracts,
        expiredContracts,
        activeAtEndOfMonth: activeAtEnd,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency,
      });
    }

    return result;
  }

  private async countPropertiesWithoutContract(applicationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const withActive = await (this.prisma as any).rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
      select: { propertyId: true },
      distinct: ['propertyId'],
    });
    const ids = new Set(withActive.map((r: any) => r.propertyId));
    return (this.prisma as any).property.count({
      where: {
        applicationId,
        deletedAt: null,
        isActive: true,
        id: { notIn: Array.from(ids) },
      },
    });
  }

  private async countActiveTenants(applicationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await (this.prisma as any).rental.groupBy({
      by: ['tenantId'],
      where: {
        applicationId,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
    });
    return result.length;
  }
}
