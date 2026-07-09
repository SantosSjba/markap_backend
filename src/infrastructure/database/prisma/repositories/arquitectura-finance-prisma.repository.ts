import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateArquitecturaFinancePaymentPayload,
  CreateArquitecturaFinanceSchedulePayload,
  ArquitecturaFinanceExpenseLineDto,
  ArquitecturaFinanceExpenseSummaryDto,
  ArquitecturaFinanceIncomeSummaryDto,
  ArquitecturaFinanceMovementDto,
  ArquitecturaFinanceOverviewDto,
  ArquitecturaFinancePaymentDto,
  ArquitecturaFinanceProfitabilityDto,
  ArquitecturaFinanceRepository,
  ArquitecturaFinanceScheduleDto,
  UpdateArquitecturaFinancePaymentPayload,
  UpdateArquitecturaFinanceSchedulePayload,
} from '@domain/repositories/arquitectura-finance.repository';
import { PrismaService } from '../prisma.service';
import { getArquitecturaProjectBudgetPriceTotal } from '../helpers/project-budget-query.helper';

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ym(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function buildExpenseSummary(costs: { costCategory: string; amount: Prisma.Decimal }[]): ArquitecturaFinanceExpenseSummaryDto {
  let purchases = 0;
  let labor = 0;
  let transport = 0;
  let otherExpenses = 0;
  for (const c of costs) {
    const a = num(c.amount);
    switch (c.costCategory) {
      case 'MATERIAL':
        purchases += a;
        break;
      case 'LABOR':
        labor += a;
        break;
      case 'TRANSPORT':
        transport += a;
        break;
      default:
        otherExpenses += a;
    }
  }
  return {
    purchases,
    labor,
    transport,
    otherExpenses,
    totalOut: purchases + labor + transport + otherExpenses,
  };
}

@Injectable()
export class ArquitecturaFinancePrismaRepository implements ArquitecturaFinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProjectScope(projectId: string, applicationSlug = 'arquitectura'): Promise<boolean> {
    const slug = applicationSlug.trim() || 'arquitectura';
    const n = await this.prisma.arquitecturaProject.count({
      where: { id: projectId, deletedAt: null, application: { slug } },
    });
    return n > 0;
  }

  private async refreshScheduleStatus(scheduleId: string): Promise<void> {
    const schedule = await this.prisma.arquitecturaFinanceIncomeSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule || schedule.status === 'WAIVED') return;

    const agg = await this.prisma.arquitecturaProjectPayment.aggregate({
      where: { scheduleItemId: scheduleId, status: 'PAID' },
      _sum: { amount: true },
    });
    const paid = num(agg._sum.amount);
    const target = num(schedule.amount);
    let next = 'PENDING';
    if (paid >= target - 0.009) next = 'PAID';
    else if (paid > 0) next = 'PARTIAL';

    if (schedule.status !== next) {
      await this.prisma.arquitecturaFinanceIncomeSchedule.update({
        where: { id: scheduleId },
        data: { status: next },
      });
    }
  }

  async getOverview(projectId: string, applicationSlug = 'arquitectura'): Promise<ArquitecturaFinanceOverviewDto | null> {
    const slug = applicationSlug.trim() || 'arquitectura';
    const project = await this.prisma.arquitecturaProject.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        application: { select: { slug: true } },
      },
    });
    if (!project || project.application.slug !== slug) return null;

    const [schedules, payments, costs, budgetPriceTotal, sectionCount] = await Promise.all([
      this.prisma.arquitecturaFinanceIncomeSchedule.findMany({
        where: { projectId },
        orderBy: [{ sortOrder: 'asc' }, { dueDate: 'asc' }],
      }),
      this.prisma.arquitecturaProjectPayment.findMany({
        where: { projectId },
        orderBy: { paidAt: 'desc' },
      }),
      Promise.resolve([] as Array<{ id: string; costCategory: string; concept: string; amount: Prisma.Decimal; occurredAt: Date }>),
      getArquitecturaProjectBudgetPriceTotal(this.prisma, projectId),
      this.prisma.arquitecturaProjectSection.count({ where: { projectId } }),
    ]);

    const schedulePaidMap = new Map<string, number>();
    const groupedPaid = await this.prisma.arquitecturaProjectPayment.groupBy({
      by: ['scheduleItemId'],
      where: {
        projectId,
        status: 'PAID',
        scheduleItemId: { not: null },
      },
      _sum: { amount: true },
    });
    for (const g of groupedPaid) {
      if (g.scheduleItemId) schedulePaidMap.set(g.scheduleItemId, num(g._sum.amount));
    }

    const mappedSchedules: ArquitecturaFinanceScheduleDto[] = schedules.map((s) => ({
      id: s.id,
      kind: s.kind,
      dueDate: s.dueDate.toISOString().slice(0, 10),
      amount: num(s.amount),
      concept: s.concept,
      sortOrder: s.sortOrder,
      status: s.status,
      paidTowardSchedule: schedulePaidMap.get(s.id) ?? 0,
    }));

    const mappedPayments: ArquitecturaFinancePaymentDto[] = payments.map((p) => ({
      id: p.id,
      paidAt: p.paidAt.toISOString(),
      amount: num(p.amount),
      concept: p.concept,
      paymentType: p.paymentType ?? 'OTHER',
      status: p.status,
      scheduleItemId: p.scheduleItemId,
    }));

    const expenseLines: ArquitecturaFinanceExpenseLineDto[] = costs.map((c) => ({
      id: c.id,
      costCategory: c.costCategory,
      concept: c.concept,
      amount: num(c.amount),
      occurredAt: c.occurredAt.toISOString().slice(0, 10),
    }));

    const expenseSummary = buildExpenseSummary(costs);

    let advancesScheduled = 0;
    let installmentsScheduled = 0;
    let scheduledTotal = 0;
    for (const s of schedules) {
      const a = num(s.amount);
      scheduledTotal += a;
      if (s.kind === 'ADVANCE') advancesScheduled += a;
      else if (s.kind === 'INSTALLMENT') installmentsScheduled += a;
    }

    const collectedConfirmed = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + num(p.amount), 0);

    const pendingFromClient = Math.max(0, scheduledTotal - collectedConfirmed);

    const incomeSummary: ArquitecturaFinanceIncomeSummaryDto = {
      scheduledTotal,
      advancesScheduled,
      installmentsScheduled,
      collectedConfirmed,
      pendingFromClient,
    };

    const budgetReference =
      sectionCount > 0
        ? {
            id: projectId,
            code: project.code,
            version: 1,
            grandTotal: budgetPriceTotal,
            taxableTotal: budgetPriceTotal,
            igvTotal: 0,
            status: project.status,
          }
        : null;

    const contractValue = budgetReference?.grandTotal ?? 0;
    const totalActualCosts = expenseSummary.totalOut;
    const profitability: ArquitecturaFinanceProfitabilityDto = {
      contractValue,
      totalScheduled: scheduledTotal,
      totalCollected: collectedConfirmed,
      totalActualCosts,
      budgetVsCosts: contractValue - totalActualCosts,
      collectedVsCosts: collectedConfirmed - totalActualCosts,
      marginOnCollectedPct:
        collectedConfirmed > 0 ? ((collectedConfirmed - totalActualCosts) / collectedConfirmed) * 100 : null,
    };

    const monthKeys = new Set<string>();
    for (const p of payments) {
      if (p.status === 'PAID') monthKeys.add(ym(p.paidAt));
    }
    for (const c of costs) {
      monthKeys.add(ym(c.occurredAt));
    }
    const sortedMonths = [...monthKeys].sort();

    const cashFlowByMonth = sortedMonths.map((month) => {
      let inflow = 0;
      let outflow = 0;
      for (const p of payments) {
        if (p.status === 'PAID' && ym(p.paidAt) === month) inflow += num(p.amount);
      }
      for (const c of costs) {
        if (ym(c.occurredAt) === month) outflow += num(c.amount);
      }
      return { month, inflow, outflow, net: inflow - outflow };
    });

    const movements: ArquitecturaFinanceMovementDto[] = [];
    for (const p of payments) {
      if (p.status !== 'PAID') continue;
      movements.push({
        occurredAt: p.paidAt.toISOString(),
        direction: 'IN',
        concept: p.concept,
        amount: num(p.amount),
        refKind: 'PAYMENT',
      });
    }
    for (const c of costs) {
      movements.push({
        occurredAt: c.occurredAt.toISOString(),
        direction: 'OUT',
        concept: `${c.costCategory}: ${c.concept}`,
        amount: num(c.amount),
        refKind: 'COST',
      });
    }
    movements.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const recentMovements = movements.slice(0, 80);

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      budgetReference,
      schedules: mappedSchedules,
      payments: mappedPayments,
      expenseLines,
      incomeSummary,
      expenseSummary,
      profitability,
      cashFlowByMonth,
      recentMovements,
    };
  }

  async createSchedule(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinanceSchedulePayload,
  ): Promise<ArquitecturaFinanceScheduleDto> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    const row = await this.prisma.arquitecturaFinanceIncomeSchedule.create({
      data: {
        projectId,
        kind: payload.kind.trim(),
        dueDate: payload.dueDate,
        amount: new Prisma.Decimal(payload.amount),
        concept: payload.concept.trim(),
        sortOrder: payload.sortOrder ?? 0,
        status: 'PENDING',
      },
    });

    return {
      id: row.id,
      kind: row.kind,
      dueDate: row.dueDate.toISOString().slice(0, 10),
      amount: num(row.amount),
      concept: row.concept,
      sortOrder: row.sortOrder,
      status: row.status,
      paidTowardSchedule: 0,
    };
  }

  async updateSchedule(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinanceSchedulePayload,
  ): Promise<ArquitecturaFinanceScheduleDto> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    const existing = await this.prisma.arquitecturaFinanceIncomeSchedule.findFirst({
      where: { id: scheduleId, projectId },
    });
    if (!existing) throw new Error('SCHEDULE_NOT_FOUND');

    const patch: Prisma.ArquitecturaFinanceIncomeScheduleUpdateInput = {};
    if (payload.kind !== undefined) patch.kind = payload.kind.trim();
    if (payload.dueDate !== undefined) patch.dueDate = payload.dueDate;
    if (payload.amount !== undefined) patch.amount = new Prisma.Decimal(payload.amount);
    if (payload.concept !== undefined) patch.concept = payload.concept.trim();
    if (payload.sortOrder !== undefined) patch.sortOrder = payload.sortOrder;
    if (payload.status !== undefined) patch.status = payload.status.trim();

    await this.prisma.arquitecturaFinanceIncomeSchedule.update({
      where: { id: scheduleId },
      data: patch,
    });

    if (payload.status === undefined || payload.status !== 'WAIVED') {
      await this.refreshScheduleStatus(scheduleId);
    }

    const ov = await this.getOverview(projectId, applicationSlug);
    const s = ov?.schedules.find((x) => x.id === scheduleId);
    if (!s) throw new Error('SCHEDULE_NOT_FOUND');
    return s;
  }

  async deleteSchedule(projectId: string, scheduleId: string, applicationSlug: string | undefined): Promise<void> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    const existing = await this.prisma.arquitecturaFinanceIncomeSchedule.findFirst({
      where: { id: scheduleId, projectId },
    });
    if (!existing) throw new Error('SCHEDULE_NOT_FOUND');

    await this.prisma.arquitecturaFinanceIncomeSchedule.delete({ where: { id: scheduleId } });
  }

  async createPayment(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinancePaymentPayload,
  ): Promise<ArquitecturaFinancePaymentDto> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    let scheduleItemId: string | null = payload.scheduleItemId?.trim() || null;
    if (scheduleItemId) {
      const sch = await this.prisma.arquitecturaFinanceIncomeSchedule.findFirst({
        where: { id: scheduleItemId, projectId },
      });
      if (!sch) throw new Error('SCHEDULE_LINK_INVALID');
    } else {
      scheduleItemId = null;
    }

    const row = await this.prisma.arquitecturaProjectPayment.create({
      data: {
        projectId,
        paidAt: payload.paidAt,
        amount: new Prisma.Decimal(payload.amount),
        concept: payload.concept.trim(),
        paymentType: payload.paymentType?.trim() || 'OTHER',
        status: payload.status.trim(),
        scheduleItemId,
      },
    });

    if (scheduleItemId) await this.refreshScheduleStatus(scheduleItemId);

    return {
      id: row.id,
      paidAt: row.paidAt.toISOString(),
      amount: num(row.amount),
      concept: row.concept,
      paymentType: row.paymentType ?? 'OTHER',
      status: row.status,
      scheduleItemId: row.scheduleItemId,
    };
  }

  async updatePayment(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinancePaymentPayload,
  ): Promise<ArquitecturaFinancePaymentDto> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    const existing = await this.prisma.arquitecturaProjectPayment.findFirst({
      where: { id: paymentId, projectId },
    });
    if (!existing) throw new Error('PAYMENT_NOT_FOUND');

    let scheduleItemId = existing.scheduleItemId;
    if (payload.scheduleItemId !== undefined) {
      const sid = payload.scheduleItemId?.trim() || null;
      if (sid) {
        const sch = await this.prisma.arquitecturaFinanceIncomeSchedule.findFirst({
          where: { id: sid, projectId },
        });
        if (!sch) throw new Error('SCHEDULE_LINK_INVALID');
        scheduleItemId = sid;
      } else {
        scheduleItemId = null;
      }
    }

    const patch: Prisma.ArquitecturaProjectPaymentUpdateInput = {};
    if (payload.paidAt !== undefined) patch.paidAt = payload.paidAt;
    if (payload.amount !== undefined) patch.amount = new Prisma.Decimal(payload.amount);
    if (payload.concept !== undefined) patch.concept = payload.concept.trim();
    if (payload.paymentType !== undefined) patch.paymentType = payload.paymentType.trim();
    if (payload.status !== undefined) patch.status = payload.status.trim();
    if (payload.scheduleItemId !== undefined) {
      patch.scheduleItem = scheduleItemId
        ? { connect: { id: scheduleItemId } }
        : { disconnect: true };
    }

    await this.prisma.arquitecturaProjectPayment.update({
      where: { id: paymentId },
      data: patch,
    });

    const oldSid = existing.scheduleItemId;
    if (oldSid) await this.refreshScheduleStatus(oldSid);
    if (scheduleItemId && scheduleItemId !== oldSid) await this.refreshScheduleStatus(scheduleItemId);

    const updated = await this.prisma.arquitecturaProjectPayment.findUnique({ where: { id: paymentId } });
    if (!updated) throw new Error('PAYMENT_NOT_FOUND');

    return {
      id: updated.id,
      paidAt: updated.paidAt.toISOString(),
      amount: num(updated.amount),
      concept: updated.concept,
      paymentType: updated.paymentType ?? 'OTHER',
      status: updated.status,
      scheduleItemId: updated.scheduleItemId,
    };
  }

  async deletePayment(projectId: string, paymentId: string, applicationSlug: string | undefined): Promise<void> {
    const ok = await this.ensureProjectScope(projectId, applicationSlug);
    if (!ok) throw new Error('PROJECT_NOT_FOUND');

    const existing = await this.prisma.arquitecturaProjectPayment.findFirst({
      where: { id: paymentId, projectId },
    });
    if (!existing) throw new Error('PAYMENT_NOT_FOUND');

    await this.prisma.arquitecturaProjectPayment.delete({ where: { id: paymentId } });

    if (existing.scheduleItemId) await this.refreshScheduleStatus(existing.scheduleItemId);
  }
}
