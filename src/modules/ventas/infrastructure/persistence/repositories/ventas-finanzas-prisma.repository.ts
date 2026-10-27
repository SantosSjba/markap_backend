import { BadRequestException, Injectable } from '@nestjs/common';
import { startOfTodayLima } from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  computeNetPayable,
  mapCommissionEnrichment,
  rebalanceCommissionPartsToNet,
  roundMoney,
  syncSaleCommissionStatus,
} from '../../../../../shared/utils/sale-commission.util';
import type {
  CommissionCurrencyTotals,
  CommissionStats,
  ListBuyerPaymentsFilters,
  ListCommissionsFilters,
  ListDocCostsFilters,
  VentasBuyerPaymentKind,
  VentasDocCostType,
  VentasFinanzasRepository,
} from '../../../domain/repositories/ventas-finanzas.repository';
import { deriveBuyerPaymentDisplayStatus } from '../mappers/ventas-finanzas-prisma.mapper';

const commissionListInclude = {
  closing: {
    select: {
      id: true,
      finalPrice: true,
      closedAt: true,
      paymentType: true,
      buyer: { select: { id: true, fullName: true } },
      property: {
        select: { id: true, code: true, addressLine: true, saleCurrency: true },
      },
    },
  },
  saleProcess: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      pipelineStage: true,
      property: {
        select: {
          id: true,
          code: true,
          addressLine: true,
          salePrice: true,
          saleCurrency: true,
        },
      },
      buyer: { select: { id: true, fullName: true } },
    },
  },
  agent: { select: { id: true, fullName: true, type: true } },
  paymentParts: { orderBy: { partNumber: 'asc' as const } },
  deductibles: { orderBy: { createdAt: 'asc' as const } },
};

function enrichCommissionRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const amount = Number(row.amount);
  const deductibles = ((row.deductibles as { amount: number }[]) ?? []).map(
    (d) => ({
      ...d,
      amount: Number(d.amount),
    }),
  );
  const paymentParts = (
    (row.paymentParts as Record<string, unknown>[]) ?? []
  ).map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));
  return {
    ...row,
    paymentParts,
    deductibles,
    ...mapCommissionEnrichment({ amount, deductibles, paymentParts }),
  };
}

@Injectable()
export class VentasFinanzasPrismaRepository implements VentasFinanzasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentCommissionPercent(
    applicationId: string,
    agentId: string,
  ): Promise<number | null> {
    const row = await this.prisma.ventasAgentCommissionProfile.findUnique({
      where: {
        applicationId_agentId: { applicationId, agentId },
      },
      select: { commissionPercent: true },
    });
    return row?.commissionPercent ?? null;
  }

  async upsertAgentCommissionProfile(data: {
    applicationId: string;
    agentId: string;
    commissionPercent: number;
  }): Promise<unknown> {
    return this.prisma.ventasAgentCommissionProfile.upsert({
      where: {
        applicationId_agentId: {
          applicationId: data.applicationId,
          agentId: data.agentId,
        },
      },
      create: {
        applicationId: data.applicationId,
        agentId: data.agentId,
        commissionPercent: data.commissionPercent,
      },
      update: { commissionPercent: data.commissionPercent },
      include: {
        agent: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async listAgentCommissionProfiles(applicationId: string): Promise<unknown[]> {
    const rows = await this.prisma.ventasAgentCommissionProfile.findMany({
      where: { applicationId },
      include: {
        agent: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows;
  }

  async listBuyerPayments(
    filters: ListBuyerPaymentsFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where: Record<string, unknown> = {
      closing: { applicationId: app.id },
    };

    if (filters.buyerClientId) {
      (where.closing as Record<string, unknown>) = {
        applicationId: app.id,
        buyerClientId: filters.buyerClientId,
      };
    }

    if (filters.saleClosingId) where.saleClosingId = filters.saleClosingId;
    if (filters.kind) where.kind = filters.kind;

    const today = startOfTodayLima();
    if (filters.displayStatus === 'PAID') {
      where.status = 'PAID';
    } else if (filters.displayStatus === 'OVERDUE') {
      where.status = 'PENDING';
      where.dueDate = { lt: today };
    } else if (filters.displayStatus === 'PENDING') {
      where.status = 'PENDING';
      where.dueDate = { gte: today };
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleBuyerPayment.findMany({
        where,
        include: {
          closing: {
            select: {
              id: true,
              finalPrice: true,
              closedAt: true,
              buyer: { select: { id: true, fullName: true } },
              property: {
                select: {
                  id: true,
                  code: true,
                  addressLine: true,
                  saleCurrency: true,
                },
              },
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleBuyerPayment.count({ where }),
    ]);

    const data = rows.map((r) => ({
      ...r,
      displayStatus: deriveBuyerPaymentDisplayStatus(r),
    }));

    return { data: data, total };
  }

  async createBuyerPayment(data: {
    applicationId: string;
    saleClosingId: string;
    kind: VentasBuyerPaymentKind;
    amount: number;
    currency: string;
    dueDate: Date;
    notes?: string | null;
  }): Promise<{ id: string }> {
    const row = await this.prisma.saleBuyerPayment.create({
      data: {
        saleClosingId: data.saleClosingId,
        kind: data.kind,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate,
        status: 'PENDING',
        notes: data.notes?.trim() || null,
      },
      select: { id: true },
    });
    return row;
  }

  async markBuyerPaymentPaid(
    id: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown> {
    const existing = await this.prisma.saleBuyerPayment.findFirst({
      where: {
        id,
        closing: { applicationId },
      },
    });
    if (!existing) return null;
    if (existing.status === 'PAID') {
      return {
        ...existing,
        displayStatus: 'PAID' as const,
      };
    }
    const row = await this.prisma.saleBuyerPayment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: paidAt ?? new Date(),
      },
      include: {
        closing: {
          select: {
            id: true,
            finalPrice: true,
            closedAt: true,
            buyer: { select: { id: true, fullName: true } },
            property: {
              select: {
                id: true,
                code: true,
                addressLine: true,
                saleCurrency: true,
              },
            },
          },
        },
      },
    });
    return {
      ...row,
      displayStatus: 'PAID' as const,
    };
  }

  async listCommissions(
    filters: ListCommissionsFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where: Record<string, unknown> = { applicationId: app.id };
    if (filters.status) where.status = filters.status;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.currency) where.currency = filters.currency;
    const q = filters.search?.trim();
    if (q) {
      const contains = { contains: q, mode: 'insensitive' as const };
      where.OR = [
        { agent: { fullName: contains } },
        { saleProcess: { code: contains } },
        { saleProcess: { title: contains } },
        { saleProcess: { property: { code: contains } } },
        { saleProcess: { property: { addressLine: contains } } },
        { saleProcess: { buyer: { fullName: contains } } },
        { closing: { property: { code: contains } } },
        { closing: { buyer: { fullName: contains } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleCommission.findMany({
        where,
        include: commissionListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleCommission.count({ where }),
    ]);

    return {
      data: (rows as Record<string, unknown>[]).map(enrichCommissionRow),
      total,
    };
  }

  async getCommissionStats(applicationSlug: string): Promise<CommissionStats> {
    const empty: CommissionStats = {
      total: 0,
      byStatus: { PENDING: 0, PARTIAL: 0, PAID: 0, CANCELLED: 0 },
      agentsWithPending: 0,
      byCurrency: [],
    };
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return empty;

    const rows = await this.prisma.saleCommission.findMany({
      where: { applicationId: app.id },
      select: {
        agentId: true,
        amount: true,
        currency: true,
        status: true,
        deductibles: { select: { amount: true } },
        paymentParts: { select: { amount: true, status: true } },
      },
    });

    const byCurrency = new Map<string, CommissionCurrencyTotals>();
    const pendingAgents = new Set<string>();
    for (const r of rows) {
      const status = r.status as keyof CommissionStats['byStatus'];
      if (status in empty.byStatus) empty.byStatus[status] += 1;
      if (r.status === 'CANCELLED') continue;

      const { netPayable } = mapCommissionEnrichment({
        amount: Number(r.amount),
        deductibles: r.deductibles.map((d) => ({ amount: Number(d.amount) })),
      });
      const paid =
        r.status === 'PAID'
          ? netPayable
          : Math.min(
              netPayable,
              r.paymentParts
                .filter((p) => p.status === 'PAID')
                .reduce((acc, p) => acc + Number(p.amount), 0),
            );
      const t = byCurrency.get(r.currency) ?? {
        currency: r.currency,
        count: 0,
        netTotal: 0,
        paidNet: 0,
        pendingNet: 0,
      };
      t.count += 1;
      t.netTotal += netPayable;
      t.paidNet += paid;
      t.pendingNet += Math.max(0, netPayable - paid);
      byCurrency.set(r.currency, t);
      if (netPayable - paid > 0) pendingAgents.add(r.agentId);
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      ...empty,
      total: rows.length,
      agentsWithPending: pendingAgents.size,
      byCurrency: [...byCurrency.values()]
        .map((t) => ({
          ...t,
          netTotal: round(t.netTotal),
          paidNet: round(t.paidNet),
          pendingNet: round(t.pendingNet),
        }))
        .sort((a, b) => b.netTotal - a.netTotal),
    };
  }

  async markCommissionPaid(
    id: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown> {
    const row = await this.prisma.saleCommission.findFirst({
      where: { id, applicationId },
      include: { saleProcess: { select: { status: true } } },
    });
    if (!row) return null;
    if (row.status === 'CANCELLED') {
      throw new BadRequestException(
        'Esta comisión fue anulada porque la venta se registró como caída.',
      );
    }
    if (row.saleProcess?.status === 'LOST') {
      throw new BadRequestException(
        'La venta está caída; no se pueden registrar pagos de comisión.',
      );
    }
    if (row.status === 'PAID') {
      return this.prisma.saleCommission
        .findFirst({
          where: { id },
          include: commissionListInclude,
        })
        .then((r) =>
          r ? enrichCommissionRow(r as Record<string, unknown>) : null,
        );
    }

    const when = paidAt ?? new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.saleCommissionPaymentPart.updateMany({
        where: { saleCommissionId: id, status: { not: 'PAID' } },
        data: { status: 'PAID', paidAt: when },
      });
      await syncSaleCommissionStatus(tx, id);
      const partCount = await tx.saleCommissionPaymentPart.count({
        where: { saleCommissionId: id },
      });
      if (partCount === 0) {
        await tx.saleCommission.update({
          where: { id },
          data: { status: 'PAID', paidAt: when },
        });
      }
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated) : null;
  }

  async markCommissionPaymentPartPaid(
    partId: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown> {
    const part = await this.prisma.saleCommissionPaymentPart.findFirst({
      where: { id: partId, saleCommission: { applicationId } },
      include: {
        saleCommission: {
          include: { saleProcess: { select: { status: true } } },
        },
      },
    });
    if (!part) return null;
    if (part.saleCommission.status === 'CANCELLED') {
      throw new BadRequestException(
        'Esta comisión fue anulada porque la venta se registró como caída.',
      );
    }
    if (part.saleCommission.saleProcess?.status === 'LOST') {
      throw new BadRequestException(
        'La venta está caída; no se pueden registrar pagos de comisión.',
      );
    }
    if (part.status === 'PAID') {
      return this.prisma.saleCommission
        .findFirst({
          where: { id: part.saleCommissionId },
          include: commissionListInclude,
        })
        .then((r) =>
          r ? enrichCommissionRow(r as Record<string, unknown>) : null,
        );
    }

    const when = paidAt ?? new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.saleCommissionPaymentPart.update({
        where: { id: partId },
        data: { status: 'PAID', paidAt: when },
      });
      await syncSaleCommissionStatus(tx, part.saleCommissionId);
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id: part.saleCommissionId },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated) : null;
  }

  async recalculateCommissionFromProfile(
    commissionId: string,
    applicationId: string,
  ): Promise<unknown> {
    const row = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId, applicationId },
      include: {
        closing: true,
        saleProcess: {
          select: { status: true, property: { select: { salePrice: true } } },
        },
        deductibles: true,
        paymentParts: { orderBy: { partNumber: 'asc' } },
      },
    });
    if (!row) return null;
    if (row.status === 'CANCELLED') {
      throw new BadRequestException(
        'No se puede recalcular una comisión anulada.',
      );
    }
    if (row.saleProcess?.status === 'LOST') {
      throw new BadRequestException(
        'La venta está caída; la comisión ya no aplica.',
      );
    }

    const profile = await this.prisma.ventasAgentCommissionProfile.findUnique({
      where: {
        applicationId_agentId: {
          applicationId,
          agentId: row.agentId,
        },
      },
    });

    if (row.calculationType === 'FIXED') {
      return row;
    }

    const basePrice =
      row.closing?.finalPrice ??
      (row.saleProcess?.property?.salePrice != null
        ? Number(row.saleProcess.property.salePrice)
        : null);
    if (basePrice == null || basePrice <= 0) return null;

    const pct = row.percentApplied ?? profile?.commissionPercent ?? null;
    if (pct == null) return null;

    const amount = Math.round(basePrice * (pct / 100) * 100) / 100;
    const net = computeNetPayable(amount, row.deductibles);

    await this.prisma.$transaction(async (tx) => {
      await tx.saleCommission.update({
        where: { id: commissionId },
        data: { amount, percentApplied: pct },
      });
      await rebalanceCommissionPartsToNet(tx, commissionId, net);
      await syncSaleCommissionStatus(tx, commissionId);
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated) : null;
  }

  async updateCommissionTerms(
    commissionId: string,
    applicationId: string,
    data: {
      calculationType: 'PERCENT' | 'FIXED';
      percent: number | null;
      fixedAmount: number | null;
      reason: string;
    },
  ): Promise<unknown> {
    const row = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId, applicationId },
      include: {
        closing: { select: { finalPrice: true } },
        saleProcess: {
          select: {
            id: true,
            status: true,
            property: { select: { salePrice: true } },
          },
        },
        deductibles: true,
        paymentParts: { select: { id: true } },
      },
    });
    if (!row) return null;
    if (row.status === 'CANCELLED') {
      throw new BadRequestException(
        'La comisión está anulada; no se puede modificar.',
      );
    }
    if (row.saleProcess?.status === 'LOST') {
      throw new BadRequestException(
        'La venta está caída; la comisión ya no aplica.',
      );
    }

    let amount: number;
    let percentApplied: number | null = null;
    if (data.calculationType === 'PERCENT') {
      // Base: precio final si ya hay cierre; si no, el precio publicado del inmueble
      const basePrice =
        row.closing?.finalPrice ??
        (row.saleProcess?.property?.salePrice != null
          ? Number(row.saleProcess.property.salePrice)
          : null);
      if (basePrice == null || basePrice <= 0) {
        throw new BadRequestException(
          'El inmueble no tiene precio de venta; registre un monto fijo o actualice el precio.',
        );
      }
      percentApplied = data.percent;
      amount = roundMoney(basePrice * ((data.percent ?? 0) / 100));
    } else {
      amount = roundMoney(data.fixedAmount ?? 0);
    }

    const net = computeNetPayable(amount, row.deductibles);
    const previous = mapCommissionEnrichment({
      amount: row.amount,
      deductibles: row.deductibles,
    });
    const describe = (type: string, pct: number | null, gross: number) =>
      type === 'PERCENT' && pct != null
        ? `${pct} % (${gross} ${row.currency})`
        : `monto fijo ${gross} ${row.currency}`;

    await this.prisma.$transaction(async (tx) => {
      // Comisión pagada sin cuotas: el pago previo queda como cuota pagada
      if (!row.paymentParts.length && row.status === 'PAID') {
        await tx.saleCommissionPaymentPart.create({
          data: {
            saleCommissionId: row.id,
            partNumber: 1,
            amount: previous.netPayable,
            status: 'PAID',
            paidAt: row.paidAt ?? new Date(),
          },
        });
      }
      await tx.saleCommission.update({
        where: { id: row.id },
        data: {
          calculationType: data.calculationType,
          amount,
          percentApplied,
        },
      });
      const partCount = await tx.saleCommissionPaymentPart.count({
        where: { saleCommissionId: row.id },
      });
      if (partCount === 0) {
        await tx.saleCommissionPaymentPart.create({
          data: {
            saleCommissionId: row.id,
            partNumber: 1,
            amount: net,
            status: 'PENDING',
          },
        });
      } else {
        await rebalanceCommissionPartsToNet(tx, row.id, net);
      }
      await syncSaleCommissionStatus(tx, row.id);

      if (row.saleProcess) {
        const agent = await tx.agent.findUnique({
          where: { id: row.agentId },
          select: { fullName: true },
        });
        await tx.saleProcessActivity.create({
          data: {
            saleProcessId: row.saleProcess.id,
            activityType: 'OTHER',
            title: `Comisión modificada${agent ? ` — ${agent.fullName}` : ''}`,
            description: `De ${describe(row.calculationType, row.percentApplied, row.amount)} a ${describe(data.calculationType, percentApplied, amount)}. Motivo: ${data.reason}`,
            completedAt: new Date(),
          },
        });
      }
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated) : null;
  }

  async getClosingPaymentCoverage(
    saleClosingId: string,
    applicationId: string,
  ): Promise<{
    currency: string;
    finalPrice: number;
    separationAmount: number;
    scheduledPayments: number;
  } | null> {
    const closing = await this.prisma.saleClosing.findFirst({
      where: { id: saleClosingId, applicationId },
      select: {
        finalPrice: true,
        property: { select: { saleCurrency: true } },
        separation: { select: { amount: true, currency: true } },
        buyerPayments: { select: { amount: true, currency: true } },
      },
    });
    if (!closing) return null;
    const currency = closing.property.saleCurrency;
    return {
      currency,
      finalPrice: closing.finalPrice,
      separationAmount:
        closing.separation?.currency === currency
          ? closing.separation.amount
          : 0,
      scheduledPayments: roundMoney(
        closing.buyerPayments
          .filter((p) => p.currency === currency)
          .reduce((s, p) => s + p.amount, 0),
      ),
    };
  }

  async getClosingCurrency(
    saleClosingId: string,
    applicationId: string,
  ): Promise<string | null> {
    const closing = await this.prisma.saleClosing.findFirst({
      where: { id: saleClosingId, applicationId },
      select: { property: { select: { saleCurrency: true } } },
    });
    return closing?.property.saleCurrency ?? null;
  }

  async listDocumentationCosts(
    filters: ListDocCostsFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where: Record<string, unknown> = { applicationId: app.id };
    if (filters.saleClosingId) where.saleClosingId = filters.saleClosingId;
    if (filters.buyerClientId) {
      where.closing = { buyerClientId: filters.buyerClientId };
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleDocumentationCost.findMany({
        where,
        include: {
          closing: {
            select: {
              id: true,
              finalPrice: true,
              buyer: { select: { id: true, fullName: true } },
              property: {
                select: { id: true, code: true, saleCurrency: true },
              },
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleDocumentationCost.count({ where }),
    ]);

    return { data: rows, total };
  }

  async createDocumentationCost(data: {
    applicationId: string;
    saleClosingId: string;
    costType: VentasDocCostType;
    amount: number;
    currency: string;
    description?: string | null;
    expenseDate: Date;
  }): Promise<{ id: string }> {
    const row = await this.prisma.saleDocumentationCost.create({
      data: {
        applicationId: data.applicationId,
        saleClosingId: data.saleClosingId,
        costType: data.costType,
        amount: data.amount,
        currency: data.currency,
        description: data.description?.trim() || null,
        expenseDate: data.expenseDate,
      },
      select: { id: true },
    });
    return row;
  }

  async getClosingProfitability(
    closingId: string,
    applicationId: string,
  ): Promise<unknown> {
    const closing = await this.prisma.saleClosing.findFirst({
      where: { id: closingId, applicationId },
      include: {
        commissions: { include: { deductibles: true } },
        documentationCosts: { select: { amount: true, currency: true } },
        buyerPayments: {
          select: { amount: true, currency: true, status: true },
        },
        separation: { select: { amount: true, currency: true } },
        buyer: { select: { id: true, fullName: true } },
        property: { select: { id: true, code: true, saleCurrency: true } },
      },
    });
    if (!closing) return null;

    // Solo se restan importes en la moneda de la venta; el resto se informa aparte
    const currency = closing.property.saleCurrency;
    const activeCommissions = closing.commissions.filter(
      (c) => c.status !== 'CANCELLED',
    );
    const sameCurrency = activeCommissions.filter(
      (c) => c.currency === currency,
    );
    const commissionGross = roundMoney(
      sameCurrency.reduce((s, c) => s + c.amount, 0),
    );
    const commissionDeductiblesTotal = roundMoney(
      sameCurrency.reduce(
        (s, c) => s + c.deductibles.reduce((ds, d) => ds + d.amount, 0),
        0,
      ),
    );
    const commissionNetPayable = Math.max(
      0,
      roundMoney(commissionGross - commissionDeductiblesTotal),
    );
    const documentationCostsTotal = roundMoney(
      closing.documentationCosts
        .filter((d) => d.currency === currency)
        .reduce((s, d) => s + d.amount, 0),
    );
    const otherCurrencies = new Map<
      string,
      { commissions: number; documentationCosts: number }
    >();
    for (const c of activeCommissions) {
      if (c.currency === currency) continue;
      const acc = otherCurrencies.get(c.currency) ?? {
        commissions: 0,
        documentationCosts: 0,
      };
      acc.commissions += computeNetPayable(c.amount, c.deductibles);
      otherCurrencies.set(c.currency, acc);
    }
    for (const d of closing.documentationCosts) {
      if (d.currency === currency) continue;
      const acc = otherCurrencies.get(d.currency) ?? {
        commissions: 0,
        documentationCosts: 0,
      };
      acc.documentationCosts += d.amount;
      otherCurrencies.set(d.currency, acc);
    }
    const netEstimated = roundMoney(
      closing.finalPrice - commissionNetPayable - documentationCostsTotal,
    );
    const allPaid =
      activeCommissions.length > 0 &&
      activeCommissions.every((c) => c.status === 'PAID');
    const anyPartial = activeCommissions.some((c) => c.status === 'PARTIAL');

    // Cobranza al comprador en la moneda de la venta (la separación va a cuenta del precio)
    const payments = closing.buyerPayments.filter(
      (p) => p.currency === currency,
    );
    const separationAmount =
      closing.separation?.currency === currency ? closing.separation.amount : 0;
    const buyerPaymentsScheduled = roundMoney(
      payments.reduce((s, p) => s + p.amount, 0),
    );
    const buyerPaymentsPaid = roundMoney(
      payments
        .filter((p) => p.status === 'PAID')
        .reduce((s, p) => s + p.amount, 0),
    );

    return {
      closingId: closing.id,
      currency,
      separationAmount,
      buyerPaymentsScheduled,
      buyerPaymentsPaid,
      balanceToSchedule: Math.max(
        0,
        roundMoney(
          closing.finalPrice - separationAmount - buyerPaymentsScheduled,
        ),
      ),
      finalPrice: closing.finalPrice,
      buyer: closing.buyer,
      property: { id: closing.property.id, code: closing.property.code },
      documentationCostsTotal,
      commissionDeductiblesTotal,
      commissionGross,
      commissionNetPayable,
      commissionAmount: commissionNetPayable,
      otherCurrencies: [...otherCurrencies.entries()].map(([cur, v]) => ({
        currency: cur,
        commissions: roundMoney(v.commissions),
        documentationCosts: roundMoney(v.documentationCosts),
      })),
      commissionStatus: activeCommissions.length
        ? allPaid
          ? 'PAID'
          : anyPartial
            ? 'PARTIAL'
            : 'PENDING'
        : null,
      netEstimated,
    };
  }

  async saleClosingBelongsToApplication(
    saleClosingId: string,
    applicationId: string,
  ): Promise<boolean> {
    const n = await this.prisma.saleClosing.count({
      where: { id: saleClosingId, applicationId },
    });
    return n > 0;
  }
}
