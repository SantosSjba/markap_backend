import { Injectable } from '@nestjs/common';
import {
  formatDateOnly,
  parseDateOnly,
  startOfTodayLima,
  todayDateOnlyLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type {
  ContractExpiringItem,
  PropertyWithoutContractItem,
} from '../../../domain/entities/report.entity';
import {
  ActiveClientReportItem,
  ContractStatusSummary,
  FinancialDistributionReportItem,
  MonthlyMetrics,
  RentalsByMonthItem,
  ReportsSummary,
} from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import { computeRentalFinancialBreakdown } from '../../../domain/utils/rental-financial-breakdown.util';
import { ReportPrismaMapper } from '../mappers/report-prisma.mapper';
import { legacyRentalCode } from '../../../domain/utils/rental-code.util';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthLastDayUtc(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

@Injectable()
export class ReportPrismaRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    applicationSlug: string,
    days: number,
  ): Promise<ReportsSummary> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new ReportsSummary(0, 0, 0, 0);
    }

    const today = startOfTodayLima();
    const endRange = parseDateOnly(formatDateOnly(today));
    endRange.setUTCDate(endRange.getUTCDate() + days);

    const [
      contratosPorVencer,
      propiedadesSinContrato,
      clientesActivos,
      clientesConIncidencias,
    ] = await Promise.all([
      this.prisma.rental.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          status: 'ACTIVE',
          endDate: { gte: today, lte: endRange },
        },
      }),
      this.countPropertiesWithoutContract(app.id),
      this.countActiveTenants(app.id),
      this.countTenantsWithOverduePayments(app.id),
    ]);

    return new ReportsSummary(
      contratosPorVencer,
      propiedadesSinContrato,
      clientesActivos,
      clientesConIncidencias,
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

    const rentals = await this.prisma.rental.findMany({
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

    return rentals.map((r) =>
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

    const propertiesWithActiveRental = await this.prisma.rental.findMany({
      where: {
        applicationId: app.id,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
      select: { propertyId: true },
      distinct: ['propertyId'],
    });
    const idsWithRental = new Set(
      propertiesWithActiveRental.map((r) => r.propertyId),
    );

    const properties = await this.prisma.property.findMany({
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

    return properties.map((p) =>
      ReportPrismaMapper.toPropertyWithoutContractItem(p),
    );
  }

  async getActiveClients(
    applicationSlug: string,
  ): Promise<ActiveClientReportItem[]> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return [];

    const countByTenant = await this.activeTenantContractCounts(app.id);
    const clients = await this.prisma.client.findMany({
      where: {
        id: { in: [...countByTenant.keys()] },
        applicationId: app.id,
        deletedAt: null,
      },
      select: { id: true, fullName: true },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map(
      (client) =>
        new ActiveClientReportItem(
          client.id,
          client.fullName,
          countByTenant.get(client.id) ?? 0,
        ),
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
      this.prisma.rental.count({
        where: { ...baseWhere, endDate: { gt: day90 } },
      }),
      this.prisma.rental.count({
        where: { ...baseWhere, endDate: { gte: day60, lte: day90 } },
      }),
      this.prisma.rental.count({
        where: { ...baseWhere, endDate: { gte: day30, lt: day60 } },
      }),
      this.prisma.rental.count({
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

    const [
      totalProps,
      rentedCount,
      newClientsThisMonth,
      tasaCobranza,
      contratosRenovados,
    ] = await Promise.all([
      this.prisma.property.count({
        where: { applicationId: app.id, deletedAt: null, isActive: true },
      }),
      this.prisma.rental.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          status: 'ACTIVE',
          endDate: { gte: today },
        },
      }),
      this.prisma.client.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
          clientType: 'TENANT',
          createdAt: { gte: startOfMonth },
        },
      }),
      this.computeCollectionRate(
        app.id,
        Number(todayYmd.slice(0, 4)),
        Number(todayYmd.slice(5, 7)),
      ),
      this.countRenewedContracts(app.id, startOfMonth),
    ]);

    const tasaOcupacion =
      totalProps > 0 ? Math.round((rentedCount / totalProps) * 100) : 0;

    return new MonthlyMetrics(
      tasaOcupacion,
      tasaCobranza,
      contratosRenovados,
      newClientsThisMonth,
    );
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
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Determinar el rango de meses a procesar
    let monthsToProcess: Array<{ year: number; month: number }> = [];

    if (startDate && endDate) {
      // Modo rango de fechas: generar todos los meses entre startDate y endDate
      const start = parseDateOnly(startDate);
      const end = parseDateOnly(endDate);
      const startYmd = formatDateOnly(start);
      const cur = parseDateOnly(`${startYmd.slice(0, 7)}-01`);
      while (cur <= end) {
        monthsToProcess.push({
          year: cur.getUTCFullYear(),
          month: cur.getUTCMonth() + 1,
        });
        cur.setUTCMonth(cur.getUTCMonth() + 1);
      }
    } else if (month && month >= 1 && month <= 12) {
      // Modo mes específico
      monthsToProcess = [{ year, month }];
    } else {
      // Modo año completo (comportamiento original: 12 meses)
      monthsToProcess = Array.from({ length: 12 }, (_, i) => ({
        year,
        month: i + 1,
      }));
    }

    const result: RentalsByMonthItem[] = [];
    const baseWhere = { applicationId: app.id, deletedAt: null };
    const rangeStart = startDate ? parseDateOnly(startDate) : undefined;
    const rangeEnd = endDate ? parseDateOnly(endDate) : undefined;

    for (const { year: y, month: m } of monthsToProcess) {
      const firstDay = parseDateOnly(`${y}-${pad2(m)}-01`);
      const lastDay = parseDateOnly(
        `${y}-${pad2(m)}-${pad2(monthLastDayUtc(y, m))}`,
      );

      const periodStart =
        rangeStart && rangeStart > firstDay ? rangeStart : firstDay;
      const periodEnd = rangeEnd && rangeEnd < lastDay ? rangeEnd : lastDay;

      const [newContracts, expiredContracts, activeAtEnd, revenueRentals] =
        await Promise.all([
          this.prisma.rental.count({
            where: {
              ...baseWhere,
              startDate: { gte: periodStart, lte: periodEnd },
            },
          }),
          this.prisma.rental.count({
            where: { ...baseWhere, endDate: { gte: firstDay, lte: lastDay } },
          }),
          this.prisma.rental.count({
            where: {
              ...baseWhere,
              status: 'ACTIVE',
              startDate: { lte: lastDay },
              endDate: { gte: lastDay },
            },
          }),
          // Solo alquileres CONCRETADOS (startDate) dentro del período efectivo del mes
          this.prisma.rental.findMany({
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
                  expenseCurrency: true,
                  taxType: true,
                  taxValue: true,
                  taxCurrency: true,
                  externalAgentType: true,
                  externalAgentValue: true,
                  externalAgentCurrency: true,
                  internalAgentType: true,
                  internalAgentValue: true,
                  internalAgentCurrency: true,
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

      for (const r of revenueRentals) {
        const monthly = Number(r.monthlyAmount || 0);
        totalRevenue += monthly;
        const cfg = r.financialConfig;
        // Totales en la moneda del contrato (los montos fijos en otra moneda no se convierten)
        const totals = computeRentalFinancialBreakdown(
          monthly,
          cfg ?? undefined,
          r.currency,
        ).totalsByCurrency[0];
        companyRevenue += totals.income;
        totalExpense += totals.expense;
        totalTax += totals.tax;
        totalExternalCommission += totals.externalAgentCommission;
        totalInternalCommission += totals.internalAgentCommission;
        totalUtility += totals.utility;
      }

      const currency =
        revenueRentals.length > 0 ? revenueRentals[0].currency || 'PEN' : 'PEN';

      // Para el monthName cuando el año es diferente al solicitado (modo rango), incluir el año
      const monthLabel =
        startDate && endDate && (y !== year || monthsToProcess.length > 12)
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

    const rentals = await this.prisma.rental.findMany({
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

    return rentals.map((r) => {
      const cfg = r.financialConfig;
      const monthlyAmount = Number(r.monthlyAmount);
      // Totales en la moneda del contrato (los montos fijos en otra moneda no se convierten)
      const totals = computeRentalFinancialBreakdown(
        monthlyAmount,
        cfg ?? undefined,
        r.currency,
      ).totalsByCurrency[0];

      const rentalCode = r.code ?? legacyRentalCode(r.id, r.startDate);

      const externalAgentName =
        cfg?.externalAgent?.fullName ?? cfg?.externalAgentName ?? null;
      const internalAgentName =
        cfg?.internalAgent?.fullName ?? cfg?.internalAgentName ?? null;

      return new FinancialDistributionReportItem(
        r.id,
        rentalCode,
        r.property?.addressLine ?? '—',
        r.property?.owner?.fullName ?? '—',
        r.tenant?.fullName ?? '—',
        r.currency,
        totals.income,
        monthlyAmount,
        totals.expense,
        totals.tax,
        totals.externalAgentCommission,
        totals.internalAgentCommission,
        totals.utility,
        externalAgentName,
        internalAgentName,
        r.status,
        formatDateOnly(r.startDate),
      );
    });
  }

  private async countPropertiesWithoutContract(
    applicationId: string,
  ): Promise<number> {
    const today = startOfTodayLima();
    const withActive = await this.prisma.rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: today },
      },
      select: { propertyId: true },
      distinct: ['propertyId'],
    });
    const ids = new Set(withActive.map((r) => r.propertyId));
    return this.prisma.property.count({
      where: {
        applicationId,
        deletedAt: null,
        isActive: true,
        id: { notIn: Array.from(ids) },
      },
    });
  }

  private async activeTenantContractCounts(
    applicationId: string,
  ): Promise<Map<string, number>> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: startOfTodayLima() },
      },
      select: { tenantId: true, tenants: { select: { clientId: true } } },
    });
    const counts = new Map<string, number>();
    for (const rental of rentals) {
      const tenantIds = new Set([
        rental.tenantId,
        ...rental.tenants.map((tenant) => tenant.clientId),
      ]);
      for (const tenantId of tenantIds)
        counts.set(tenantId, (counts.get(tenantId) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * % cobrado de las cuotas del período (mismo criterio que `PaymentStats`):
   * cobrado / (cobrado + saldo pendiente).
   */
  private async computeCollectionRate(
    applicationId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const rental = { applicationId, deletedAt: null };
    const [collectedAgg, pendingAgg] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          periodYear: year,
          periodMonth: month,
          status: { in: ['PAID', 'PARTIAL'] },
          rental,
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          periodYear: year,
          periodMonth: month,
          status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
          rental,
        },
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    const collected = collectedAgg._sum.paidAmount ?? 0;
    const pending = Math.max(
      0,
      (pendingAgg._sum.amount ?? 0) - (pendingAgg._sum.paidAmount ?? 0),
    );
    const expected = collected + pending;
    return expected > 0 ? Math.round((collected / expected) * 100) : 0;
  }

  /**
   * Contratos que inician en el mes actual y renuevan uno anterior: mismo
   * inquilino y misma propiedad con un contrato previo (no hay vínculo explícito).
   */
  private async countRenewedContracts(
    applicationId: string,
    startOfMonth: Date,
  ): Promise<number> {
    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setUTCMonth(startOfNextMonth.getUTCMonth() + 1);

    const startedThisMonth = await this.prisma.rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        startDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { id: true, tenantId: true, propertyId: true, startDate: true },
    });
    if (startedThisMonth.length === 0) return 0;

    const previous = await this.prisma.rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        startDate: { lt: startOfNextMonth },
        OR: startedThisMonth.map((r) => ({
          tenantId: r.tenantId,
          propertyId: r.propertyId,
        })),
      },
      select: { id: true, tenantId: true, propertyId: true, startDate: true },
    });

    return startedThisMonth.filter((r) =>
      previous.some(
        (p) =>
          p.id !== r.id &&
          p.tenantId === r.tenantId &&
          p.propertyId === r.propertyId &&
          p.startDate < r.startDate,
      ),
    ).length;
  }

  /** Inquilinos distintos con cuotas vencidas en contratos activos (criterio de atrasos). */
  private async countTenantsWithOverduePayments(
    applicationId: string,
  ): Promise<number> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        applicationId,
        deletedAt: null,
        status: 'ACTIVE',
        payments: {
          some: {
            OR: [
              { status: 'OVERDUE' },
              { status: 'PARTIAL', dueDate: { lt: startOfTodayLima() } },
            ],
          },
        },
      },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });
    return rentals.length;
  }

  private async countActiveTenants(applicationId: string): Promise<number> {
    const counts = await this.activeTenantContractCounts(applicationId);
    return this.prisma.client.count({
      where: { applicationId, deletedAt: null, id: { in: [...counts.keys()] } },
    });
  }
}
