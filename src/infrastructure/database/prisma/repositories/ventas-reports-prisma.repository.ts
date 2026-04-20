import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  VentasReportsRepository,
  VentasReportsDateRange,
  VentasReportsGranularity,
  SalesByPeriodRow,
  AgentPerformanceRow,
  ConversionReport,
  FinancialFlowReport,
} from '../../../../application/repositories/ventas-reports.repository';

function periodLabel(d: Date, granularity: VentasReportsGranularity): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (granularity === 'month') return `${y}-${m}`;
  if (granularity === 'day') return `${y}-${m}-${day}`;
  const weekStart = new Date(d);
  const dow = weekStart.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const wy = weekStart.getFullYear();
  const wm = String(weekStart.getMonth() + 1).padStart(2, '0');
  const wd = String(weekStart.getDate()).padStart(2, '0');
  return `${wy}-${wm}-${wd}`;
}

@Injectable()
export class VentasReportsPrismaRepository implements VentasReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesByPeriod(
    range: VentasReportsDateRange,
    granularity: VentasReportsGranularity,
  ): Promise<SalesByPeriodRow[]> {
    const rows = await this.prisma.saleClosing.findMany({
      where: {
        applicationId: range.applicationId,
        closedAt: { gte: range.startDate, lte: range.endDate },
      },
      select: { closedAt: true, finalPrice: true },
      orderBy: { closedAt: 'asc' },
    });

    const map = new Map<string, { closingsCount: number; totalAmount: number }>();
    for (const r of rows) {
      const key = periodLabel(r.closedAt, granularity);
      const cur = map.get(key) ?? { closingsCount: 0, totalAmount: 0 };
      cur.closingsCount += 1;
      cur.totalAmount += r.finalPrice;
      map.set(key, cur);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({
        period,
        closingsCount: v.closingsCount,
        totalAmount: Math.round(v.totalAmount * 100) / 100,
      }));
  }

  async getAgentPerformance(range: VentasReportsDateRange): Promise<AgentPerformanceRow[]> {
    const grouped = await this.prisma.saleClosing.groupBy({
      by: ['agentId'],
      where: {
        applicationId: range.applicationId,
        closedAt: { gte: range.startDate, lte: range.endDate },
        agentId: { not: null },
      },
      _count: { _all: true },
      _sum: { finalPrice: true },
    });

    const agentIds = grouped.map((g) => g.agentId).filter((id): id is string => id != null);
    if (agentIds.length === 0) return [];

    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(agents.map((a) => [a.id, a.fullName]));

    const commByAgent = await this.prisma.saleCommission.groupBy({
      by: ['agentId'],
      where: {
        applicationId: range.applicationId,
        closing: {
          closedAt: { gte: range.startDate, lte: range.endDate },
        },
      },
      _sum: { amount: true },
    });
    const commissionSum = new Map(
      commByAgent.map((c) => [c.agentId, c._sum.amount ?? 0]),
    );

    return grouped
      .filter((g) => g.agentId)
      .map((g) => ({
        agentId: g.agentId as string,
        agentName: nameById.get(g.agentId as string) ?? '—',
        closingsCount: g._count._all,
        totalSales: Math.round((g._sum.finalPrice ?? 0) * 100) / 100,
        totalCommissionAmount:
          Math.round((commissionSum.get(g.agentId as string) ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  async getConversion(range: VentasReportsDateRange): Promise<ConversionReport> {
    const applicationId = range.applicationId;

    const [
      opportunitiesCreated,
      opportunitiesWon,
      opportunitiesLost,
      separationsCreated,
      closingsCount,
      stageGroups,
    ] = await Promise.all([
      this.prisma.saleProcess.count({
        where: {
          applicationId,
          deletedAt: null,
          createdAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.saleProcess.count({
        where: {
          applicationId,
          deletedAt: null,
          status: 'WON',
          closedAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.saleProcess.count({
        where: {
          applicationId,
          deletedAt: null,
          status: 'LOST',
          closedAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.saleSeparation.count({
        where: {
          applicationId,
          createdAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.saleClosing.count({
        where: {
          applicationId,
          closedAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.saleProcess.groupBy({
        by: ['pipelineStage'],
        where: { applicationId, deletedAt: null, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    const activePipelineByStage: Record<string, number> = {};
    for (const s of stageGroups) {
      activePipelineByStage[s.pipelineStage] = s._count._all;
    }

    const conversionRatePercent =
      opportunitiesCreated > 0
        ? Math.round((opportunitiesWon / opportunitiesCreated) * 10000) / 100
        : 0;

    return {
      opportunitiesCreated,
      opportunitiesWon,
      opportunitiesLost,
      separationsCreated,
      closingsCount,
      conversionRatePercent,
      activePipelineByStage,
    };
  }

  async getFinancialFlow(range: VentasReportsDateRange): Promise<FinancialFlowReport> {
    const applicationId = range.applicationId;

    const [collectedAgg, pendingAgg, docsAgg, commGroups] = await Promise.all([
      this.prisma.saleBuyerPayment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: range.startDate, lte: range.endDate },
          closing: { applicationId },
        },
        _sum: { amount: true },
      }),
      this.prisma.saleBuyerPayment.aggregate({
        where: {
          status: 'PENDING',
          closing: { applicationId },
        },
        _sum: { amount: true },
      }),
      this.prisma.saleDocumentationCost.aggregate({
        where: {
          applicationId,
          expenseDate: { gte: range.startDate, lte: range.endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.saleCommission.groupBy({
        by: ['status'],
        where: {
          applicationId,
          closing: {
            closedAt: { gte: range.startDate, lte: range.endDate },
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const buyerPaymentsCollected = collectedAgg._sum.amount ?? 0;
    const buyerPaymentsPending = pendingAgg._sum.amount ?? 0;
    const documentationCostsTotal = docsAgg._sum.amount ?? 0;

    let commissionsPaidAmount = 0;
    let commissionsPendingAmount = 0;
    for (const g of commGroups) {
      const amt = g._sum.amount ?? 0;
      if (g.status === 'PAID') commissionsPaidAmount += amt;
      else commissionsPendingAmount += amt;
    }

    commissionsPaidAmount = Math.round(commissionsPaidAmount * 100) / 100;
    commissionsPendingAmount = Math.round(commissionsPendingAmount * 100) / 100;

    const estimatedNetAfterCosts =
      Math.round(
        (buyerPaymentsCollected - documentationCostsTotal - commissionsPaidAmount) * 100,
      ) / 100;

    return {
      buyerPaymentsCollected: Math.round(buyerPaymentsCollected * 100) / 100,
      buyerPaymentsPending: Math.round(buyerPaymentsPending * 100) / 100,
      documentationCostsTotal: Math.round(documentationCostsTotal * 100) / 100,
      commissionsPaidAmount,
      commissionsPendingAmount,
      estimatedNetAfterCosts,
    };
  }
}
