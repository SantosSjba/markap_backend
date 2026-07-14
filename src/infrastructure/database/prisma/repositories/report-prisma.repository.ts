import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReportPrismaMapper } from '../mappers/report-prisma.mapper';
import type { ReportRepository } from '@domain/repositories/report.repository';
import {
  ActiveClientReportItem,
  ContractStatusSummary,
  FinancialDistributionReportItem,
  MonthlyMetrics,
  RentalsByMonthItem,
  ReportsSummary,
} from '@domain/entities/report.entity';
import type {
  ContractExpiringItem,
  PropertyWithoutContractItem,
} from '@domain/entities/report.entity';
import { computeRentalFinancialBreakdown } from '@domain/utils/rental-financial-breakdown.util';
import {
  dateOnlyYear,
  formatDateOnly,
  parseDateOnly,
  startOfTodayLima,
  todayDateOnlyLima,
} from '@domain/utils/peru-date.util';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthLastDayUtc(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

@Injectable()
export class ReportPrismaRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(applicationSlug: string, days: number): Promise<ReportsSummary> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new ReportsSummary(0, 0, 0, 0);
    }

    const today = startOfTodayLima();
    const endRange = parseDateOnly(formatDateOnly(today));
    endRange.setUTCDate(endRange.getUTCDate() + days);

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

    return new ReportsSummary(
      contratosPorVencer,
      propiedadesSinContrato,
      clientesActivos,
      0,
    );
  }

  async getContractsExpiring(
    applicationSlug: string,
    days: number,
  ): Promise<ContractExpiringItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = startOfTodayLima();
    const endRange = parseDateOnly(formatDateOnly(today));
    endRange.setUTCDate(endRange.getUTCDate() + days);

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

    return rentals.map((r: any) =>
      ReportPrismaMapper.toContractExpiringItem(r, today),
    );
  }

  async getPropertiesWithoutContract(
    applicationSlug: string,
  ): Promise<PropertyWithoutContractItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = startOfTodayLima();

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
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p: any) => ReportPrismaMapper.toPropertyWithoutContractItem(p));
  }

  async getActiveClients(applicationSlug: string): Promise<ActiveClientReportItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const today = startOfTodayLima();

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
      orderBy: { createdAt: 'desc' },
    });
    const countByTenant = Object.fromEntries(
      tenantsWithActive.map((g: any) => [g.tenantId, g._count.id]),
    );

    return clients.map(
      (c: any) =>
        new ActiveClientReportItem(c.id, c.fullName, countByTenant[c.id] ?? 0),
    );
  }

  async getContractStatusSummary(
    applicationSlug: string,
  ): Promise<ContractStatusSummary> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new ContractStatusSummary(0, 0, 0, 0);
    }

    const today = startOfTodayLima();
    const day90 = parseDateOnly(formatDateOnly(today));
    day90.setUTCDate(day90.getUTCDate() + 90);
    const day60 = parseDateOnly(formatDateOnly(today));
    day60.setUTCDate(day60.getUTCDate() + 60);
    const day30 = parseDateOnly(formatDateOnly(today));
    day30.setUTCDate(day30.getUTCDate() + 30);

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

    return new ContractStatusSummary(vigentes, porVencer, proximos, urgentes);
  }

  async getMonthlyMetrics(applicationSlug: string): Promise<MonthlyMetrics> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new MonthlyMetrics(0, 0, 0, 0);
    }

    const today = startOfTodayLima();
    const todayYmd = todayDateOnlyLima();
    const startOfMonth = parseDateOnly(`${todayYmd.slice(0, 7)}-01`);
    startOfMonth.setUTCHours(0, 0, 0, 0);

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

    return new MonthlyMetrics(tasaOcupacion, 0, 0, newClientsThisMonth);
  }

  async getRentalsByMonth(
    applicationSlug: string,
    year: number,
    month?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RentalsByMonthItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    // Determinar el rango de meses a procesar
    let monthsToProcess: Array<{ year: number; month: number }> = [];

    if (startDate && endDate) {
      // Modo rango de fechas: generar todos los meses entre startDate y endDate
      const start = parseDateOnly(startDate);
      const end = parseDateOnly(endDate);
      const startYmd = formatDateOnly(start);
      let cur = parseDateOnly(`${startYmd.slice(0, 7)}-01`);
      while (cur <= end) {
        monthsToProcess.push({ year: cur.getUTCFullYear(), month: cur.getUTCMonth() + 1 });
        cur.setUTCMonth(cur.getUTCMonth() + 1);
      }
    } else if (month && month >= 1 && month <= 12) {
      // Modo mes específico
      monthsToProcess = [{ year, month }];
    } else {
      // Modo año completo (comportamiento original: 12 meses)
      monthsToProcess = Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
    }

    const result: RentalsByMonthItem[] = [];
    const baseWhere = { applicationId: app.id, deletedAt: null };
    const rangeStart = startDate ? parseDateOnly(startDate) : undefined;
    const rangeEnd = endDate ? parseDateOnly(endDate) : undefined;

    for (const { year: y, month: m } of monthsToProcess) {
      const firstDay = parseDateOnly(`${y}-${pad2(m)}-01`);
      const lastDay = parseDateOnly(`${y}-${pad2(m)}-${pad2(monthLastDayUtc(y, m))}`);

      const periodStart =
        rangeStart && rangeStart > firstDay ? rangeStart : firstDay;
      const periodEnd = rangeEnd && rangeEnd < lastDay ? rangeEnd : lastDay;

      const [newContracts, expiredContracts, activeAtEnd, revenueRentals] =
        await Promise.all([
          (this.prisma as any).rental.count({
            where: { ...baseWhere, startDate: { gte: periodStart, lte: periodEnd } },
          }),
          (this.prisma as any).rental.count({
            where: { ...baseWhere, endDate: { gte: firstDay, lte: lastDay } },
          }),
          (this.prisma as any).rental.count({
            where: {
              ...baseWhere,
              status: 'ACTIVE',
              startDate: { lte: lastDay },
              endDate: { gte: lastDay },
            },
          }),
          // Solo alquileres CONCRETADOS (startDate) dentro del período efectivo del mes
          (this.prisma as any).rental.findMany({
            where: {
              ...baseWhere,
              startDate: { gte: periodStart, lte: periodEnd },
            },
            select: {
              monthlyAmount: true,
              currency: true,
              financialConfig: {
                select: {
                  baseAmount: true,
                  expenseType: true,
                  expenseValue: true,
                  taxType: true,
                  taxValue: true,
                  externalAgentType: true,
                  externalAgentValue: true,
                  internalAgentType: true,
                  internalAgentValue: true,
                },
              },
            },
          }),
        ]);

      let totalRevenue = 0;
      let companyRevenue = 0;
      let totalExpense = 0;
      let totalTax = 0;
      let totalExternalCommission = 0;
      let totalInternalCommission = 0;
      let totalUtility = 0;

      for (const r of revenueRentals as any[]) {
        const monthly = Number(r.monthlyAmount || 0);
        totalRevenue += monthly;
        const cfg = r.financialConfig;
        const breakdown = computeRentalFinancialBreakdown(monthly, cfg ?? undefined);
        companyRevenue += breakdown.base;
        totalExpense += breakdown.expense;
        totalTax += breakdown.tax;
        totalExternalCommission += breakdown.externalAgentCommission;
        totalInternalCommission += breakdown.internalAgentCommission;
        totalUtility += breakdown.utility;
      }

      const currency =
        revenueRentals.length > 0
          ? (revenueRentals[0] as any).currency || 'PEN'
          : 'PEN';

      // Para el monthName cuando el año es diferente al solicitado (modo rango), incluir el año
      const monthLabel = startDate && endDate && (y !== year || monthsToProcess.length > 12)
        ? `${monthNames[m - 1]} ${y}`
        : monthNames[m - 1];

      result.push(
        new RentalsByMonthItem(
          m,
          y,
          monthLabel,
          newContracts,
          expiredContracts,
          activeAtEnd,
          Math.round(totalRevenue * 100) / 100,
          Math.round(companyRevenue * 100) / 100,
          Math.round(totalExpense * 100) / 100,
          Math.round(totalTax * 100) / 100,
          Math.round(totalExternalCommission * 100) / 100,
          Math.round(totalInternalCommission * 100) / 100,
          Math.round(totalUtility * 100) / 100,
          currency,
        ),
      );
    }

    return result;
  }

  async getFinancialDistributionReport(
    applicationSlug: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialDistributionReportItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    // Filtro por fecha de inicio del contrato (cuándo se concretó el alquiler)
    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;
    if (startDate) {
      startDateFilter = parseDateOnly(startDate);
    }
    if (endDate) {
      endDateFilter = parseDateOnly(endDate);
    }

    const rentals = await (this.prisma as any).rental.findMany({
      where: {
        applicationId: app.id,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(startDateFilter || endDateFilter
          ? {
              startDate: {
                ...(startDateFilter ? { gte: startDateFilter } : {}),
                ...(endDateFilter ? { lte: endDateFilter } : {}),
              },
            }
          : {}),
      },
      include: {
        property: {
          select: {
            addressLine: true,
            owner: { select: { fullName: true } },
          },
        },
        tenant: { select: { fullName: true } },
        financialConfig: {
          include: {
            externalAgent: { select: { fullName: true } },
            internalAgent: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rentals.map((r: any) => {
      const cfg = r.financialConfig;
      const monthlyAmount = Number(r.monthlyAmount);
      const breakdown = computeRentalFinancialBreakdown(monthlyAmount, cfg ?? undefined);

      const year = dateOnlyYear(r.startDate);
      const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
      const rentalCode = `ALQ-${year}-${shortId}`;

      const externalAgentName = cfg?.externalAgent?.fullName ?? cfg?.externalAgentName ?? null;
      const internalAgentName =
        cfg?.internalAgent?.fullName ?? cfg?.internalAgentName ?? null;

      return new FinancialDistributionReportItem(
        r.id,
        rentalCode,
        r.property?.addressLine ?? '—',
        r.property?.owner?.fullName ?? '—',
        r.tenant?.fullName ?? '—',
        r.currency,
        breakdown.base,
        monthlyAmount,
        breakdown.expense,
        breakdown.tax,
        breakdown.externalAgentCommission,
        breakdown.internalAgentCommission,
        breakdown.utility,
        externalAgentName,
        internalAgentName,
        r.status,
        formatDateOnly(r.startDate),
      );
    });
  }

  private async countPropertiesWithoutContract(applicationId: string): Promise<number> {
    const today = startOfTodayLima();
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
    const today = startOfTodayLima();
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
