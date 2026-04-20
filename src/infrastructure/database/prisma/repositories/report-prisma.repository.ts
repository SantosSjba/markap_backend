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

    return properties.map((p: any) => ReportPrismaMapper.toPropertyWithoutContractItem(p));
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

    return new ContractStatusSummary(vigentes, porVencer, proximos, urgentes);
  }

  async getMonthlyMetrics(applicationSlug: string): Promise<MonthlyMetrics> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new MonthlyMetrics(0, 0, 0, 0);
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
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        monthsToProcess.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
        cur.setMonth(cur.getMonth() + 1);
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

    for (const { year: y, month: m } of monthsToProcess) {
      const firstDay = new Date(y, m - 1, 1);
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(y, m, 0);
      lastDay.setHours(23, 59, 59, 999);

      const [newContracts, expiredContracts, activeAtEnd, revenueRentals] =
        await Promise.all([
          (this.prisma as any).rental.count({
            where: { ...baseWhere, startDate: { gte: firstDay, lte: lastDay } },
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
          // Solo alquileres CONCRETADOS (startDate) dentro del mes
          // El ingreso de la empresa es único por alquiler, no mensual recurrente
          (this.prisma as any).rental.findMany({
            where: {
              ...baseWhere,
              startDate: { gte: firstDay, lte: lastDay },
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

      function computeAmount(type: string, value: number, base: number): number {
        if (type === 'PERCENT') return Math.round((base * value) / 100 * 100) / 100;
        return Math.round(value * 100) / 100;
      }

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
        // Ingreso real = baseAmount configurado (monto ingresado al concretar), sino monthlyAmount
        const base = cfg?.baseAmount != null && Number(cfg.baseAmount) > 0
          ? Number(cfg.baseAmount)
          : monthly;
        companyRevenue += base;

        if (cfg) {
          const expense = computeAmount(cfg.expenseType ?? 'FIXED', Number(cfg.expenseValue ?? 0), base);
          const tax = computeAmount(cfg.taxType ?? 'FIXED', Number(cfg.taxValue ?? 0), base);
          const extComm = computeAmount(cfg.externalAgentType ?? 'FIXED', Number(cfg.externalAgentValue ?? 0), base);
          const intComm = computeAmount(cfg.internalAgentType ?? 'FIXED', Number(cfg.internalAgentValue ?? 0), base);
          totalExpense += expense;
          totalTax += tax;
          totalExternalCommission += extComm;
          totalInternalCommission += intComm;
          totalUtility += base - expense - tax - extComm - intComm;
        } else {
          totalUtility += base;
        }
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
      startDateFilter = new Date(startDate + 'T00:00:00');
    }
    if (endDate) {
      endDateFilter = new Date(endDate + 'T23:59:59');
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
            internalAgentUser: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    function computeAmount(type: string, value: number, base: number): number {
      if (type === 'PERCENT') return Math.round((base * value) / 100 * 100) / 100;
      return Math.round(value * 100) / 100;
    }

    return rentals.map((r: any) => {
      const cfg = r.financialConfig;
      const monthlyAmount = Number(r.monthlyAmount);
      const base = (cfg?.baseAmount != null && Number(cfg.baseAmount) > 0)
        ? Number(cfg.baseAmount)
        : monthlyAmount;

      const expense = cfg ? computeAmount(cfg.expenseType, Number(cfg.expenseValue), base) : 0;
      const tax = cfg ? computeAmount(cfg.taxType, Number(cfg.taxValue), base) : 0;
      const externalAgentCommission = cfg
        ? computeAmount(cfg.externalAgentType, Number(cfg.externalAgentValue), base)
        : 0;
      const internalAgentCommission = cfg
        ? computeAmount(cfg.internalAgentType, Number(cfg.internalAgentValue), base)
        : 0;
      const utility = Math.round((base - expense - tax - externalAgentCommission - internalAgentCommission) * 100) / 100;

      const year = new Date(r.startDate).getFullYear();
      const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
      const rentalCode = `ALQ-${year}-${shortId}`;

      const externalAgentName = cfg?.externalAgent?.fullName ?? cfg?.externalAgentName ?? null;
      const internalAgentName = cfg?.internalAgentUser
        ? `${cfg.internalAgentUser.firstName} ${cfg.internalAgentUser.lastName}`.trim()
        : null;

      return new FinancialDistributionReportItem(
        r.id,
        rentalCode,
        r.property.addressLine,
        r.property.owner.fullName,
        r.tenant.fullName,
        r.currency,
        base,
        monthlyAmount,
        expense,
        tax,
        externalAgentCommission,
        internalAgentCommission,
        utility,
        externalAgentName,
        internalAgentName,
        r.status,
      );
    });
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
