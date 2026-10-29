import { Injectable } from '@nestjs/common';
import {
  formatDateOnly,
  parseDateOnly,
  todayDateOnlyLima,
  startOfLimaDayInstant,
  endOfLimaDayInstant,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  computeBudgetSheet,
  type BudgetMarginMode,
  type BudgetIgvMode,
  type BudgetRowKind,
  round2,
} from '../../../domain/budget/budget-sheet.calculator';
import { computeProjectSettlement } from '../../../domain/budget/project-settlement.calculator';
import { reportMoney } from '../../../domain/reports/report-money';
import type {
  InteriorReportsDashboardDto,
  ReportProject,
  ReportSupplier,
} from '../../../domain/entities/interior-reports.entity';
import type { InteriorReportsRepository } from '../../../domain/repositories/interior-reports.repository';

const num = (v: unknown) =>
  v == null || !Number.isFinite(Number(v)) ? 0 : Number(v);
const optionalNum = (v: unknown) => (v == null ? null : num(v));
const active = (status: string) => !['FINISHED', 'CANCELLED'].includes(status);

@Injectable()
export class InteriorReportsPrismaRepository implements InteriorReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(
    applicationSlug: string,
    startDate?: string,
    endDate?: string,
  ): Promise<InteriorReportsDashboardDto | null> {
    const slug = applicationSlug.trim() || 'interiorismo';
    const app = await this.prisma.application.findUnique({ where: { slug } });
    if (!app) return null;
    const today = todayDateOnlyLima();
    const fallback = parseDateOnly(today);
    fallback.setUTCDate(fallback.getUTCDate() - 89);
    const range = {
      startDate: startDate || formatDateOnly(fallback),
      endDate: endDate || today,
    };
    const inPeriod = (day: string) =>
      day >= range.startDate && day <= range.endDate;
    const projectBase = { applicationId: app.id, deletedAt: null };
    const [projects, purchases, clients, tasks, completedTasks, openIncidents] =
      await Promise.all([
        this.prisma.interiorProject.findMany({
          where: projectBase,
          orderBy: { createdAt: 'desc' },
          include: {
            budgets: {
              where: { isActive: true },
              take: 1,
              orderBy: { version: 'desc' },
              include: {
                rows: {
                  include: {
                    supplierPayments: true,
                    materialSupplier: { select: { companyName: true } },
                  },
                },
              },
            },
            payments: {
              where: { status: 'PAID' },
              orderBy: { paidAt: 'desc' },
            },
          },
        }),
        this.prisma.interiorMaterialPurchase.findMany({
          where: {
            supplier: { applicationId: app.id },
            purchasedAt: {
              gte: startOfLimaDayInstant(range.startDate),
              lte: endOfLimaDayInstant(range.endDate),
            },
          },
          include: { supplier: { select: { companyName: true } } },
        }),
        this.prisma.client.count({
          where: { applicationId: app.id, deletedAt: null },
        }),
        this.prisma.interiorExecutionTask.count({
          where: { project: projectBase },
        }),
        this.prisma.interiorExecutionTask.count({
          where: { project: projectBase, kanbanStatus: 'DONE' },
        }),
        this.prisma.interiorExecutionIncident.count({
          where: { project: projectBase, status: { not: 'CLOSED' } },
        }),
      ]);
    const suppliers = new Map<string, ReportSupplier>();
    const getSupplier = (
      supplierId: string | null,
      name: string,
      currency: string,
    ) => {
      const key = JSON.stringify([supplierId ?? name, currency]);
      let row = suppliers.get(key);
      if (!row) {
        row = {
          key,
          supplierId,
          name,
          currency,
          actualCost: 0,
          paid: 0,
          balance: 0,
          catalogPurchases: 0,
        };
        suppliers.set(key, row);
      }
      return row;
    };
    const profitability: ReportProject[] = projects.map((p) => {
      const budget = p.budgets[0];
      const currency = budget?.currency ?? p.currency;
      const totals = budget
        ? computeBudgetSheet(
            {
              currency,
              exchangeRate: optionalNum(budget.exchangeRate),
              marginMode: budget.marginMode as BudgetMarginMode,
              utilityPct: num(budget.utilityPct),
              overheadPct: num(budget.overheadPct),
              igvMode: budget.igvMode as BudgetIgvMode,
              igvPct: num(budget.igvPct),
            },
            budget.rows.map((r) => ({
              ...r,
              kind: r.kind as BudgetRowKind,
              quantity: optionalNum(r.quantity),
              unitPrice: optionalNum(r.unitPrice),
              directCost: optionalNum(r.directCost),
              actualCost: optionalNum(r.actualCost),
              utilityPctOverride: optionalNum(r.utilityPctOverride),
              supplierPaymentsTotal: r.supplierPayments.reduce(
                (s, pay) => s + num(pay.amount),
                0,
              ),
            })),
          ).totals
        : {
            total: num(p.estimatedBudget),
            igv: 0,
            actualCost: 0,
            supplierPayments: 0,
          };
      const settlement = computeProjectSettlement(
        totals,
        {
          currency,
          exchangeRate: optionalNum(budget?.exchangeRate ?? p.exchangeRate),
        },
        p.payments.map((pay) => ({
          ...pay,
          amount: num(pay.amount),
          exchangeRate: optionalNum(pay.exchangeRate),
        })),
      );
      for (const r of budget?.rows ?? []) {
        if (r.kind !== 'ITEM' || (!r.supplierId && !r.supplierName)) continue;
        const supplier = getSupplier(
          r.supplierId,
          r.materialSupplier?.companyName ?? r.supplierName ?? 'Sin proveedor',
          currency,
        );
        const paid = r.supplierPayments.reduce(
          (s, pay) => s + num(pay.amount),
          0,
        );
        supplier.actualCost += num(r.actualCost);
        supplier.paid += paid;
        // Cada partida conserva su saldo: un anticipo no compensa otra partida.
        supplier.balance += Math.max(0, num(r.actualCost) - paid);
      }
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        createdDate: todayDateOnlyLima(p.createdAt),
        currency,
        budget: totals.total,
        actualCost: totals.actualCost,
        paid: settlement.totalClientPaid,
        pending: settlement.pendingToCollect,
        utility: settlement.milestoneUtility,
        marginPct: settlement.marginPct,
        unconverted: settlement.unconverted,
      };
    });
    const collections = projects
      .flatMap((p) =>
        p.payments.map((pay) => ({
          id: pay.id,
          projectId: p.id,
          projectCode: p.code,
          concept: pay.concept,
          date: todayDateOnlyLima(pay.paidAt),
          currency: pay.currency || p.budgets[0]?.currency || p.currency,
          amount: num(pay.amount),
        })),
      )
      .filter((pay) => inPeriod(pay.date))
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const p of purchases)
      getSupplier(
        p.supplierId,
        p.supplier.companyName,
        p.currency,
      ).catalogPurchases += num(p.totalAmount);
    const supplierRows = [...suppliers.values()].map((r) => ({
      ...r,
      actualCost: round2(r.actualCost),
      paid: round2(r.paid),
      balance: round2(r.balance),
      catalogPurchases: round2(r.catalogPurchases),
    }));
    const periodProjects = profitability.filter((p) => inPeriod(p.createdDate));
    const current = profitability.filter((p) => p.status !== 'CANCELLED');
    const stageCounts = new Map<string, number>();
    for (const p of profitability)
      stageCounts.set(p.status, (stageCounts.get(p.status) ?? 0) + 1);
    const monthly: InteriorReportsDashboardDto['monthly'] = [];
    const cursor = parseDateOnly(range.startDate);
    cursor.setUTCDate(1);
    while (formatDateOnly(cursor).slice(0, 7) <= range.endDate.slice(0, 7)) {
      const key = formatDateOnly(cursor).slice(0, 7);
      monthly.push({
        key,
        projects: periodProjects.filter((p) => p.createdDate.startsWith(key))
          .length,
        collections: reportMoney(
          collections.filter((p) => p.date.startsWith(key)),
          (p) => p.currency,
          (p) => p.amount,
        ),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return {
      applicationSlug: slug,
      range,
      projects: periodProjects,
      profitability,
      collections,
      suppliers: supplierRows,
      monthly,
      totals: {
        budget: reportMoney(
          current,
          (p) => p.currency,
          (p) => p.budget,
        ),
        actualCost: reportMoney(
          current,
          (p) => p.currency,
          (p) => p.actualCost,
        ),
        collected: reportMoney(
          collections,
          (p) => p.currency,
          (p) => p.amount,
        ),
        pending: reportMoney(
          current,
          (p) => p.currency,
          (p) => Math.max(0, p.pending),
        ),
        supplierBalance: reportMoney(
          supplierRows,
          (p) => p.currency,
          (p) => p.balance,
        ),
        catalogPurchases: reportMoney(
          purchases,
          (p) => p.currency,
          (p) => num(p.totalAmount),
        ),
      },
      stages: [...stageCounts].map(([status, count]) => ({ status, count })),
      kpis: {
        activeProjects: projects.filter((p) => active(p.status)).length,
        inExecution: projects.filter((p) => p.status === 'IN_PROGRESS').length,
        clients,
        quotation: projects.filter((p) => p.status === 'QUOTE').length,
        newProjects: periodProjects.length,
        tasks,
        completedTasks,
        openIncidents,
      },
      alerts: {
        overdueProjects: projects.filter(
          (p) =>
            active(p.status) &&
            p.estimatedEndDate &&
            formatDateOnly(p.estimatedEndDate) < today,
        ).length,
        pendingProjects: current.filter((p) => p.pending > 0).length,
        unpaidSuppliers: supplierRows.filter((p) => p.balance > 0).length,
        unconvertedPayments: current.reduce(
          (s, p) => s + p.unconverted.length,
          0,
        ),
      },
    };
  }
}
