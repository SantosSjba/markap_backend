import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { sumProjectBudgetPriceTotals } from '../helpers/project-budget-query.helper';
import type { InteriorReportsRepository } from '@domain/repositories/interior-reports.repository';
import type {
  InteriorReportsConversionDto,
  InteriorReportsCostosDto,
  InteriorReportsDashboardDto,
  InteriorReportsKpisDto,
  InteriorReportsProductividadDto,
  InteriorReportsRentabilidadDto,
  InteriorReportsVentasDto,
} from '@domain/entities/interior-reports.entity';
import { formatDateOnly, parseDateOnly, todayDateOnlyLima } from '@domain/utils/peru-date.util';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function defaultRange(): { startDate: string; endDate: string } {
  const endDate = todayDateOnlyLima();
  const start = parseDateOnly(endDate);
  start.setUTCDate(start.getUTCDate() - 89);
  return {
    startDate: formatDateOnly(start),
    endDate,
  };
}

function dayStartUtc(isoDate: string): Date {
  const d = parseDateOnly(isoDate);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dayEndUtc(isoDate: string): Date {
  const d = parseDateOnly(isoDate);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

@Injectable()
export class InteriorReportsPrismaRepository implements InteriorReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(
    applicationSlug: string,
    startDate?: string,
    endDate?: string,
  ): Promise<InteriorReportsDashboardDto | null> {
    const slug = (applicationSlug || 'interiorismo').trim() || 'interiorismo';
    const app = await this.prisma.application.findUnique({ where: { slug } });
    if (!app) return null;

    const fallback = defaultRange();
    const startStr = startDate?.trim() || fallback.startDate;
    const endStr = endDate?.trim() || fallback.endDate;
    const range = { startDate: startStr, endDate: endStr };
    const start = dayStartUtc(startStr);
    const end = dayEndUtc(endStr);

    const projectBase = { applicationId: app.id, deletedAt: null as null };

    const [
      paymentsAgg,
      distinctPaidProjects,
      pendingScheduleAgg,
      statusGroups,
      projectsNew,
      projectsFinished,
      budgetsApproved,
      budgetsRejected,
      budgetsSentSnapshot,
      approvedProjectsInPeriod,
      execCostsAgg,
      purchasesAgg,
      costByCat,
      tasksCounts,
      tasksDonePeriod,
      evidencesPeriod,
      openIncidents,
      avgProgress,
      draftBudgets,
      activeClients,
      projectsRunning,
      inExecution,
    ] = await Promise.all([
      this.prisma.interiorProjectPayment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: start, lte: end },
          project: projectBase,
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.interiorProjectPayment.findMany({
        where: {
          status: 'PAID',
          paidAt: { gte: start, lte: end },
          project: projectBase,
        },
        distinct: ['projectId'],
        select: { projectId: true },
      }),
      this.prisma.interiorFinanceIncomeSchedule.aggregate({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          project: projectBase,
        },
        _sum: { amount: true },
      }),
      this.prisma.interiorProject.groupBy({
        by: ['status'],
        where: projectBase,
        _count: { _all: true },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: 'FINISHED',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: 'APPROVED',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: 'CANCELLED',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: 'QUOTE',
        },
      }),
      this.prisma.interiorProject.findMany({
        where: {
          ...projectBase,
          status: 'APPROVED',
          updatedAt: { gte: start, lte: end },
        },
        select: { id: true },
      }),
      this.prisma.interiorExecutionActualCost.aggregate({
        where: {
          occurredAt: { gte: start, lte: end },
          project: projectBase,
        },
        _sum: { amount: true },
      }),
      this.prisma.interiorMaterialPurchase.aggregate({
        where: {
          purchasedAt: { gte: start, lte: end },
          supplier: { applicationId: app.id },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.interiorExecutionActualCost.groupBy({
        by: ['costCategory'],
        where: {
          occurredAt: { gte: start, lte: end },
          project: projectBase,
        },
        _sum: { amount: true },
      }),
      this.prisma.interiorExecutionTask.count({
        where: { project: projectBase },
      }),
      this.prisma.interiorExecutionTask.count({
        where: {
          project: projectBase,
          kanbanStatus: 'DONE',
          updatedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorExecutionEvidence.count({
        where: {
          project: projectBase,
          capturedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.interiorExecutionIncident.count({
        where: {
          project: projectBase,
          status: { not: 'CLOSED' },
        },
      }),
      this.prisma.interiorProject.aggregate({
        where: projectBase,
        _avg: { progressPct: true },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: { in: ['PROSPECT', 'DESIGN', 'QUOTE'] },
        },
      }),
      this.prisma.client.count({
        where: {
          applicationId: app.id,
          deletedAt: null,
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: { notIn: ['CANCELLED', 'FINISHED'] },
        },
      }),
      this.prisma.interiorProject.count({
        where: {
          ...projectBase,
          status: 'IN_PROGRESS',
        },
      }),
    ]);

    const tareasTotales = tasksCounts;
    const tareasHechasSnapshot = await this.prisma.interiorExecutionTask.count({
      where: { project: projectBase, kanbanStatus: 'DONE' },
    });

    const cobranzas = num(paymentsAgg._sum.amount);
    const compras = num(purchasesAgg._sum.totalAmount);
    const costosEjec = num(execCostsAgg._sum.amount);
    const volumenAprob = await sumProjectBudgetPriceTotals(
      this.prisma,
      approvedProjectsInPeriod.map((p) => p.id),
    );
    const margenBruto = volumenAprob - costosEjec - compras;
    const denomVentas = volumenAprob > 0 ? volumenAprob : null;
    const margenBrutoPct = denomVentas !== null ? (margenBruto / denomVentas) * 100 : null;

    const closedDenom = budgetsApproved + budgetsRejected;
    const tasaCierre =
      closedDenom > 0 ? Math.round((budgetsApproved / closedDenom) * 1000) / 10 : null;

    const conversion: InteriorReportsConversionDto = {
      proyectosPorEstado: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      proyectosNuevosPeriodo: projectsNew,
      proyectosFinalizadosPeriodo: projectsFinished,
      presupuestosAprobadosPeriodo: budgetsApproved,
      presupuestosRechazadosPeriodo: budgetsRejected,
      presupuestosEnviadosSnapshot: budgetsSentSnapshot,
      tasaCierrePresupuestoPct: tasaCierre,
    };

    const ventas: InteriorReportsVentasDto = {
      cobranzasPeriodo: cobranzas,
      pagosRegistradosPeriodo: paymentsAgg._count._all ?? 0,
      proyectosConCobroEnPeriodo: distinctPaidProjects.length,
      carteraPendienteCuotas: num(pendingScheduleAgg._sum.amount),
    };

    const rentabilidad: InteriorReportsRentabilidadDto = {
      volumenPresupuestosAprobadosPeriodo: volumenAprob,
      costosEjecucionPeriodo: costosEjec,
      comprasMaterialesPeriodo: compras,
      margenBrutoEstimado: margenBruto,
      margenBrutoPct: margenBrutoPct !== null ? Math.round(margenBrutoPct * 10) / 10 : null,
    };

    const pctTareas =
      tareasTotales > 0 ? Math.round((tareasHechasSnapshot / tareasTotales) * 1000) / 10 : null;

    const productividad: InteriorReportsProductividadDto = {
      tareasTotales,
      tareasCompletadasSnapshot: tareasHechasSnapshot,
      tareasCompletadasPeriodo: tasksDonePeriod,
      pctAvanceTareas: pctTareas,
      evidenciasPeriodo: evidencesPeriod,
      incidenciasAbiertas: openIncidents,
      progresoPromedioProyectosPct: avgProgress._avg.progressPct
        ? Math.round(num(avgProgress._avg.progressPct) * 10) / 10
        : null,
    };

    const ejecPorCat = costByCat.map((c) => ({
      category: c.costCategory,
      total: num(c._sum.amount),
    }));
    const totalCostosPeriodo = costosEjec + compras;

    const costos: InteriorReportsCostosDto = {
      ejecucionPorCategoria: ejecPorCat.sort((a, b) => b.total - a.total),
      comprasProveedoresPeriodo: compras,
      totalCostosPeriodo,
    };

    const kpis: InteriorReportsKpisDto = {
      proyectosActivos: projectsRunning,
      proyectosEnEjecucion: inExecution,
      clientesTotales: activeClients,
      presupuestosBorrador: draftBudgets,
    };

    return {
      applicationSlug: slug,
      range,
      ventas,
      conversion,
      rentabilidad,
      productividad,
      costos,
      kpis,
    };
  }
}
