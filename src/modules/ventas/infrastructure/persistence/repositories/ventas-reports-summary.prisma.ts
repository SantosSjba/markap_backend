import type { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { todayDateOnlyLima } from '../../../../../shared/domain/utils/peru-date.util';
import { mapCommissionEnrichment } from '../../../../../shared/utils/sale-commission.util';
import type { VentasReportsDateRange } from '../../../domain/entities/ventas-reports.entity';
import type {
  AgentsSummary,
  AgentsSummaryRow,
  ConversionSummary,
  FinancialSummary,
  FinancialSummaryCurrency,
  SalesSummary,
  SalesSummaryClosing,
  VentasSummaryGranularity,
} from '../../../domain/entities/ventas-reports-summary.types';

/**
 * Resúmenes de Reportes de Ventas calculados en memoria (volúmenes chicos por aplicación).
 * Regla: los montos se agrupan por moneda; nunca se suman monedas distintas.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;
const DAY_MS = 86_400_000;

/** Periodo en hora de Lima: `2026-03` (mes) o `2026` (año) */
function periodKey(d: Date, g: VentasSummaryGranularity): string {
  const ymd = todayDateOnlyLima(d);
  return g === 'year' ? ymd.slice(0, 4) : ymd.slice(0, 7);
}

const inRange = (d: Date | null | undefined, r: VentasReportsDateRange) =>
  !!d && d >= r.startDate && d <= r.endDate;

/** Mapa moneda → acumulador, creado bajo demanda */
function bucket<T>(
  map: Map<string, T>,
  key: string,
  init: () => NoInfer<T>,
): T {
  let v = map.get(key);
  if (!v) {
    v = init();
    map.set(key, v);
  }
  return v;
}

const byCurrencyOrder = <T extends { currency: string }>(rows: T[]) =>
  rows.sort((a, b) =>
    a.currency === 'PEN'
      ? -1
      : b.currency === 'PEN'
        ? 1
        : a.currency.localeCompare(b.currency),
  );

/** Neto y monto pagado de una comisión (respeta cuotas y deducibles) */
function commissionAmounts(c: {
  amount: number;
  status: string;
  deductibles: { amount: number }[];
  paymentParts: { amount: number; status: string; paidAt: Date | null }[];
}) {
  const { netPayable } = mapCommissionEnrichment({
    amount: c.amount,
    deductibles: c.deductibles,
  });
  const paidParts = c.paymentParts
    .filter((p) => p.status === 'PAID')
    .reduce((a, p) => a + p.amount, 0);
  const paid =
    c.status === 'PAID' ? netPayable : Math.min(netPayable, paidParts);
  return {
    net: netPayable,
    paid,
    pending: c.status === 'CANCELLED' ? 0 : Math.max(0, netPayable - paid),
  };
}

export async function buildSalesSummary(
  prisma: PrismaService,
  range: VentasReportsDateRange,
  g: VentasSummaryGranularity,
): Promise<SalesSummary> {
  const closings = await prisma.saleClosing.findMany({
    where: {
      applicationId: range.applicationId,
      closedAt: { gte: range.startDate, lte: range.endDate },
    },
    select: {
      id: true,
      closedAt: true,
      finalPrice: true,
      paymentType: true,
      property: {
        select: {
          code: true,
          addressLine: true,
          salePrice: true,
          saleCurrency: true,
          propertyType: { select: { name: true } },
        },
      },
      buyer: { select: { fullName: true } },
      agent: { select: { fullName: true } },
      saleProcess: { select: { id: true, code: true, createdAt: true } },
    },
    orderBy: { closedAt: 'desc' },
  });

  // Comisiones de cada venta (por cierre o por su proceso), sin las anuladas
  const closingIds = closings.map((c) => c.id);
  const processIds = closings.flatMap((c) =>
    c.saleProcess ? [c.saleProcess.id] : [],
  );
  const commissionRows = closings.length
    ? await prisma.saleCommission.findMany({
        where: {
          applicationId: range.applicationId,
          status: { not: 'CANCELLED' },
          OR: [
            { saleClosingId: { in: closingIds } },
            { saleProcessId: { in: processIds } },
          ],
        },
        select: {
          saleClosingId: true,
          saleProcessId: true,
          amount: true,
          currency: true,
          status: true,
          agent: { select: { fullName: true } },
          deductibles: { select: { amount: true } },
          paymentParts: {
            select: { amount: true, status: true, paidAt: true },
          },
        },
      })
    : [];
  const commissionsOf = (closingId: string, processId: string | null) =>
    commissionRows
      .filter(
        (k) =>
          k.saleClosingId === closingId ||
          (!!processId && k.saleProcessId === processId),
      )
      .map((k) => {
        const { net, paid } = commissionAmounts(k);
        return {
          agentName: k.agent.fullName,
          currency: k.currency,
          total: round2(net),
          paid: round2(paid),
        };
      });

  const totals = new Map<
    string,
    { count: number; total: number; listTotal: number; listedSales: number }
  >();
  const periods = new Map<
    string,
    {
      closings: number;
      byCurrency: Map<string, { count: number; total: number }>;
    }
  >();
  const rows: SalesSummaryClosing[] = [];

  for (const c of closings) {
    const currency = c.property.saleCurrency ?? 'PEN';
    const listPrice = c.property.salePrice ?? null;
    const t = bucket(totals, currency, () => ({
      count: 0,
      total: 0,
      listTotal: 0,
      listedSales: 0,
    }));
    t.count += 1;
    t.total += c.finalPrice;
    if (listPrice) {
      t.listTotal += listPrice;
      t.listedSales += c.finalPrice;
    }
    const p = bucket(periods, periodKey(c.closedAt, g), () => ({
      closings: 0,
      byCurrency: new Map(),
    }));
    p.closings += 1;
    const pc = bucket(p.byCurrency, currency, () => ({ count: 0, total: 0 }));
    pc.count += 1;
    pc.total += c.finalPrice;

    rows.push({
      id: c.id,
      closedAt: c.closedAt,
      processId: c.saleProcess?.id ?? null,
      processCode: c.saleProcess?.code ?? null,
      propertyCode: c.property.code,
      propertyAddress: c.property.addressLine,
      propertyType: c.property.propertyType?.name ?? null,
      buyerName: c.buyer.fullName,
      agentName: c.agent?.fullName ?? null,
      finalPrice: round2(c.finalPrice),
      listPrice,
      currency,
      paymentType: c.paymentType,
      period: periodKey(c.closedAt, g),
      commissions: commissionsOf(c.id, c.saleProcess?.id ?? null),
      daysToClose: c.saleProcess
        ? Math.max(
            0,
            Math.round(
              (c.closedAt.getTime() - c.saleProcess.createdAt.getTime()) /
                DAY_MS,
            ),
          )
        : null,
    });
  }

  return {
    closings: closings.length,
    byCurrency: byCurrencyOrder(
      [...totals.entries()].map(([currency, t]) => ({
        currency,
        count: t.count,
        total: round2(t.total),
        average: round2(t.total / t.count),
        listTotal: round2(t.listTotal),
        discountPercent:
          t.listTotal > 0
            ? round2(((t.listTotal - t.listedSales) / t.listTotal) * 100)
            : 0,
      })),
    ),
    periods: [...periods.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, p]) => ({
        period,
        closings: p.closings,
        byCurrency: byCurrencyOrder(
          [...p.byCurrency.entries()].map(([currency, v]) => ({
            currency,
            count: v.count,
            total: round2(v.total),
          })),
        ),
      })),
    rows,
  };
}

export async function buildAgentsSummary(
  prisma: PrismaService,
  range: VentasReportsDateRange,
): Promise<AgentsSummary> {
  const applicationId = range.applicationId;
  const [processes, closings, commissions] = await Promise.all([
    prisma.saleProcess.findMany({
      where: { applicationId, deletedAt: null, agentId: { not: null } },
      select: { agentId: true, status: true, createdAt: true, closedAt: true },
    }),
    prisma.saleClosing.findMany({
      where: {
        applicationId,
        agentId: { not: null },
        closedAt: { gte: range.startDate, lte: range.endDate },
      },
      select: {
        agentId: true,
        finalPrice: true,
        property: { select: { saleCurrency: true } },
      },
    }),
    prisma.saleCommission.findMany({
      where: {
        applicationId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            closing: { closedAt: { gte: range.startDate, lte: range.endDate } },
          },
          {
            saleProcess: {
              status: 'WON',
              closedAt: { gte: range.startDate, lte: range.endDate },
            },
          },
        ],
      },
      select: {
        agentId: true,
        amount: true,
        currency: true,
        status: true,
        deductibles: { select: { amount: true } },
        paymentParts: { select: { amount: true, status: true, paidAt: true } },
      },
    }),
  ]);

  type Acc = Omit<
    AgentsSummaryRow,
    'agentName' | 'agentType' | 'winRate' | 'sales' | 'commissions'
  > & {
    sales: Map<string, { count: number; total: number }>;
    commissions: Map<string, { total: number; paid: number; pending: number }>;
  };
  const acc = new Map<string, Acc>();
  const get = (agentId: string) =>
    bucket(acc, agentId, () => ({
      agentId,
      processesCreated: 0,
      activeProcesses: 0,
      won: 0,
      lost: 0,
      sales: new Map(),
      commissions: new Map(),
    }));

  for (const p of processes) {
    const a = get(p.agentId!);
    if (inRange(p.createdAt, range)) a.processesCreated += 1;
    if (p.status === 'ACTIVE') a.activeProcesses += 1;
    if (p.status === 'WON' && inRange(p.closedAt, range)) a.won += 1;
    if (p.status === 'LOST' && inRange(p.closedAt, range)) a.lost += 1;
  }
  for (const c of closings) {
    const s = bucket(
      get(c.agentId!).sales,
      c.property.saleCurrency ?? 'PEN',
      () => ({ count: 0, total: 0 }),
    );
    s.count += 1;
    s.total += c.finalPrice;
  }
  for (const c of commissions) {
    const { net, paid, pending } = commissionAmounts(c);
    const s = bucket(get(c.agentId).commissions, c.currency, () => ({
      total: 0,
      paid: 0,
      pending: 0,
    }));
    s.total += net;
    s.paid += paid;
    s.pending += pending;
  }

  const agents = await prisma.agent.findMany({
    where: { id: { in: [...acc.keys()] } },
    select: { id: true, fullName: true, type: true },
  });
  const info = new Map(agents.map((a) => [a.id, a]));

  return {
    agents: [...acc.values()]
      .filter(
        (a) =>
          a.processesCreated ||
          a.activeProcesses ||
          a.won ||
          a.lost ||
          a.sales.size ||
          a.commissions.size,
      )
      .map((a) => ({
        agentId: a.agentId,
        agentName: info.get(a.agentId)?.fullName ?? '—',
        agentType: info.get(a.agentId)?.type ?? null,
        processesCreated: a.processesCreated,
        activeProcesses: a.activeProcesses,
        won: a.won,
        lost: a.lost,
        winRate:
          a.won + a.lost > 0 ? round2((a.won / (a.won + a.lost)) * 100) : 0,
        sales: byCurrencyOrder(
          [...a.sales.entries()].map(([currency, v]) => ({
            currency,
            count: v.count,
            total: round2(v.total),
          })),
        ),
        commissions: byCurrencyOrder(
          [...a.commissions.entries()].map(([currency, v]) => ({
            currency,
            total: round2(v.total),
            paid: round2(v.paid),
            pending: round2(v.pending),
          })),
        ),
      }))
      .sort(
        (x, y) =>
          y.won - x.won ||
          y.activeProcesses - x.activeProcesses ||
          x.agentName.localeCompare(y.agentName),
      ),
  };
}

export async function buildConversionSummary(
  prisma: PrismaService,
  range: VentasReportsDateRange,
  g: VentasSummaryGranularity,
): Promise<ConversionSummary> {
  const applicationId = range.applicationId;
  const [processes, separations] = await Promise.all([
    prisma.saleProcess.findMany({
      where: { applicationId, deletedAt: null },
      select: {
        status: true,
        pipelineStage: true,
        createdAt: true,
        closedAt: true,
        lostReason: true,
        property: { select: { salePrice: true, saleCurrency: true } },
      },
    }),
    prisma.saleSeparation.count({
      where: {
        applicationId,
        separationDate: { gte: range.startDate, lte: range.endDate },
      },
    }),
  ]);

  let created = 0;
  let won = 0;
  let lost = 0;
  let active = 0;
  let daysSum = 0;
  const stages = new Map<
    string,
    { count: number; value: Map<string, number> }
  >();
  const periods = new Map<
    string,
    { created: number; won: number; lost: number }
  >();
  const reasons = new Map<string, number>();
  const period = (d: Date) =>
    bucket(periods, periodKey(d, g), () => ({ created: 0, won: 0, lost: 0 }));

  for (const p of processes) {
    if (inRange(p.createdAt, range)) {
      created += 1;
      period(p.createdAt).created += 1;
    }
    if (p.status === 'ACTIVE') {
      active += 1;
      const s = bucket(stages, p.pipelineStage, () => ({
        count: 0,
        value: new Map(),
      }));
      s.count += 1;
      if (p.property.salePrice) {
        const cur = p.property.saleCurrency ?? 'PEN';
        s.value.set(cur, (s.value.get(cur) ?? 0) + p.property.salePrice);
      }
    }
    if (p.status === 'WON' && inRange(p.closedAt, range)) {
      won += 1;
      period(p.closedAt!).won += 1;
      daysSum += Math.max(
        0,
        (p.closedAt!.getTime() - p.createdAt.getTime()) / DAY_MS,
      );
    }
    if (p.status === 'LOST' && inRange(p.closedAt, range)) {
      lost += 1;
      period(p.closedAt!).lost += 1;
      const reason = p.lostReason?.trim() || 'Sin motivo registrado';
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
  }

  return {
    created,
    won,
    lost,
    active,
    separations,
    conversionRate: created > 0 ? round2((won / created) * 100) : 0,
    winRate: won + lost > 0 ? round2((won / (won + lost)) * 100) : 0,
    avgDaysToClose: won > 0 ? Math.round(daysSum / won) : null,
    stages: [...stages.entries()].map(([stage, s]) => ({
      stage,
      count: s.count,
      value: byCurrencyOrder(
        [...s.value.entries()].map(([currency, amount]) => ({
          currency,
          amount: round2(amount),
        })),
      ),
    })),
    periods: [...periods.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, v]) => ({ period: p, ...v })),
    lostReasons: [...reasons.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function buildFinancialSummary(
  prisma: PrismaService,
  range: VentasReportsDateRange,
  g: VentasSummaryGranularity,
): Promise<FinancialSummary> {
  const applicationId = range.applicationId;
  const between = { gte: range.startDate, lte: range.endDate };
  const [closings, separations, commissions, costs, buyerPaid, buyerPending] =
    await Promise.all([
      prisma.saleClosing.findMany({
        where: { applicationId, closedAt: between },
        select: {
          closedAt: true,
          finalPrice: true,
          property: { select: { saleCurrency: true } },
        },
      }),
      prisma.saleSeparation.findMany({
        where: { applicationId, separationDate: between },
        select: { separationDate: true, amount: true, currency: true },
      }),
      // Comisiones de ventas del periodo o con pagos dentro del periodo
      prisma.saleCommission.findMany({
        where: {
          applicationId,
          status: { not: 'CANCELLED' },
          OR: [
            { closing: { closedAt: between } },
            { saleProcess: { status: 'WON', closedAt: between } },
            { paidAt: between },
            { paymentParts: { some: { paidAt: between } } },
          ],
        },
        select: {
          amount: true,
          currency: true,
          status: true,
          paidAt: true,
          closing: { select: { closedAt: true } },
          saleProcess: { select: { status: true, closedAt: true } },
          deductibles: { select: { amount: true } },
          paymentParts: {
            select: { amount: true, status: true, paidAt: true },
          },
        },
      }),
      prisma.saleDocumentationCost.findMany({
        where: { applicationId, expenseDate: between },
        select: { expenseDate: true, amount: true, currency: true },
      }),
      prisma.saleBuyerPayment.findMany({
        where: { status: 'PAID', paidAt: between, closing: { applicationId } },
        select: { amount: true, currency: true },
      }),
      prisma.saleBuyerPayment.findMany({
        where: { status: 'PENDING', closing: { applicationId } },
        select: { amount: true, currency: true },
      }),
    ]);

  const totals = new Map<string, FinancialSummaryCurrency>();
  const t = (currency: string) =>
    bucket(totals, currency, () => ({
      currency,
      salesVolume: 0,
      separations: 0,
      commissionsGenerated: 0,
      commissionsPaid: 0,
      commissionsPending: 0,
      documentationCosts: 0,
      buyerPaymentsCollected: 0,
      buyerPaymentsPending: 0,
    }));
  const periods = new Map<
    string,
    Map<
      string,
      {
        sales: number;
        separations: number;
        commissionsPaid: number;
        costs: number;
      }
    >
  >();
  const p = (d: Date, currency: string) =>
    bucket(
      bucket(periods, periodKey(d, g), () => new Map()),
      currency,
      () => ({
        sales: 0,
        separations: 0,
        commissionsPaid: 0,
        costs: 0,
      }),
    );

  for (const c of closings) {
    const cur = c.property.saleCurrency ?? 'PEN';
    t(cur).salesVolume += c.finalPrice;
    p(c.closedAt, cur).sales += c.finalPrice;
  }
  for (const s of separations) {
    t(s.currency).separations += s.amount;
    p(s.separationDate, s.currency).separations += s.amount;
  }
  for (const c of commissions) {
    const { net, pending } = commissionAmounts(c);
    const soldAt =
      c.closing?.closedAt ??
      (c.saleProcess?.status === 'WON' ? c.saleProcess.closedAt : null);
    if (inRange(soldAt, range)) {
      t(c.currency).commissionsGenerated += net;
      t(c.currency).commissionsPending += pending;
    }
    // Pagos hechos dentro del periodo: por cuota (ya en neto) o la comisión completa
    if (c.paymentParts.length) {
      for (const part of c.paymentParts) {
        if (part.status === 'PAID' && inRange(part.paidAt, range)) {
          t(c.currency).commissionsPaid += part.amount;
          p(part.paidAt!, c.currency).commissionsPaid += part.amount;
        }
      }
    } else if (c.status === 'PAID' && inRange(c.paidAt, range)) {
      t(c.currency).commissionsPaid += net;
      p(c.paidAt!, c.currency).commissionsPaid += net;
    }
  }
  for (const d of costs) {
    t(d.currency).documentationCosts += d.amount;
    p(d.expenseDate, d.currency).costs += d.amount;
  }
  for (const b of buyerPaid) t(b.currency).buyerPaymentsCollected += b.amount;
  for (const b of buyerPending) t(b.currency).buyerPaymentsPending += b.amount;

  return {
    byCurrency: byCurrencyOrder(
      [...totals.values()].map((v) => ({
        ...v,
        salesVolume: round2(v.salesVolume),
        separations: round2(v.separations),
        commissionsGenerated: round2(v.commissionsGenerated),
        commissionsPaid: round2(v.commissionsPaid),
        commissionsPending: round2(v.commissionsPending),
        documentationCosts: round2(v.documentationCosts),
        buyerPaymentsCollected: round2(v.buyerPaymentsCollected),
        buyerPaymentsPending: round2(v.buyerPaymentsPending),
      })),
    ),
    periods: [...periods.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, m]) => ({
        period,
        byCurrency: byCurrencyOrder(
          [...m.entries()].map(([currency, v]) => ({
            currency,
            sales: round2(v.sales),
            separations: round2(v.separations),
            commissionsPaid: round2(v.commissionsPaid),
            costs: round2(v.costs),
          })),
        ),
      })),
  };
}
