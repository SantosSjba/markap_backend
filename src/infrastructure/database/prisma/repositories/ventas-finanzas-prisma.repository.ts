import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  deriveBuyerPaymentDisplayStatus,
  startOfLocalDay,
} from '../mappers/ventas-finanzas-prisma.mapper';
import type {
  VentasFinanzasRepository,
  ListBuyerPaymentsFilters,
  ListCommissionsFilters,
  ListDocCostsFilters,
  VentasBuyerPaymentKind,
  VentasDocCostType,
} from '@domain/repositories/ventas-finanzas.repository';
import {
  computeNetPayable,
  mapCommissionEnrichment,
  scaleCommissionPaymentPartsToNet,
  syncSaleCommissionStatus,
} from '@common/utils/sale-commission.util';

const commissionListInclude = {
  closing: {
    select: {
      id: true,
      finalPrice: true,
      closedAt: true,
      buyer: { select: { id: true, fullName: true } },
      property: { select: { id: true, code: true, addressLine: true } },
    },
  },
  saleProcess: {
    select: {
      id: true,
      code: true,
      status: true,
      property: { select: { id: true, code: true, addressLine: true, salePrice: true } },
      buyer: { select: { id: true, fullName: true } },
    },
  },
  agent: { select: { id: true, fullName: true, type: true } },
  paymentParts: { orderBy: { partNumber: 'asc' as const } },
  deductibles: { orderBy: { createdAt: 'asc' as const } },
};

function enrichCommissionRow(row: Record<string, unknown>): Record<string, unknown> {
  const amount = Number(row.amount);
  const deductibles = ((row.deductibles as { amount: number }[]) ?? []).map((d) => ({
    ...d,
    amount: Number(d.amount),
  }));
  const paymentParts = ((row.paymentParts as Record<string, unknown>[]) ?? []).map((p) => ({
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

  async getAgentCommissionPercent(applicationId: string, agentId: string): Promise<number | null> {
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
    return rows as unknown[];
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

    if (filters.kind) where.kind = filters.kind;

    const today = startOfLocalDay();
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
              property: { select: { id: true, code: true, addressLine: true } },
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

    return { data: data as unknown[], total };
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
  ): Promise<unknown | null> {
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
            property: { select: { id: true, code: true, addressLine: true } },
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

  async markCommissionPaid(
    id: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown | null> {
    const row = await this.prisma.saleCommission.findFirst({
      where: { id, applicationId },
    });
    if (!row) return null;
    if (row.status === 'PAID') {
      return this.prisma.saleCommission.findFirst({
        where: { id },
        include: commissionListInclude,
      }).then((r) => (r ? enrichCommissionRow(r as Record<string, unknown>) : null));
    }

    const when = paidAt ?? new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.saleCommissionPaymentPart.updateMany({
        where: { saleCommissionId: id, status: { not: 'PAID' } },
        data: { status: 'PAID', paidAt: when },
      });
      await syncSaleCommissionStatus(tx, id);
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated as Record<string, unknown>) : null;
  }

  async markCommissionPaymentPartPaid(
    partId: string,
    applicationId: string,
    paidAt?: Date,
  ): Promise<unknown | null> {
    const part = await this.prisma.saleCommissionPaymentPart.findFirst({
      where: { id: partId, saleCommission: { applicationId } },
      include: { saleCommission: true },
    });
    if (!part) return null;
    if (part.status === 'PAID') {
      return this.prisma.saleCommission.findFirst({
        where: { id: part.saleCommissionId },
        include: commissionListInclude,
      }).then((r) => (r ? enrichCommissionRow(r as Record<string, unknown>) : null));
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
    return updated ? enrichCommissionRow(updated as Record<string, unknown>) : null;
  }

  async recalculateCommissionFromProfile(
    commissionId: string,
    applicationId: string,
  ): Promise<unknown | null> {
    const row = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId, applicationId },
      include: {
        closing: true,
        saleProcess: { include: { property: { select: { salePrice: true } } } },
        deductibles: true,
        paymentParts: { orderBy: { partNumber: 'asc' } },
      },
    });
    if (!row) return null;

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

    const pct =
      row.percentApplied ??
      profile?.commissionPercent ??
      null;
    if (pct == null) return null;

    const amount = Math.round(basePrice * (pct / 100) * 100) / 100;
    const net = computeNetPayable(amount, row.deductibles);

    await this.prisma.$transaction(async (tx) => {
      await tx.saleCommission.update({
        where: { id: commissionId },
        data: { amount, percentApplied: pct },
      });
      await scaleCommissionPaymentPartsToNet(tx, commissionId, net);
    });

    const updated = await this.prisma.saleCommission.findFirst({
      where: { id: commissionId },
      include: commissionListInclude,
    });
    return updated ? enrichCommissionRow(updated as Record<string, unknown>) : null;
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
              property: { select: { id: true, code: true } },
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleDocumentationCost.count({ where }),
    ]);

    return { data: rows as unknown[], total };
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
  ): Promise<unknown | null> {
    const closing = await this.prisma.saleClosing.findFirst({
      where: { id: closingId, applicationId },
      include: {
        commissions: { include: { deductibles: true } },
        buyer: { select: { id: true, fullName: true } },
        property: { select: { id: true, code: true } },
      },
    });
    if (!closing) return null;

    const commissionGross = closing.commissions.reduce((s, c) => s + c.amount, 0);
    const commissionDeductiblesTotal = closing.commissions.reduce(
      (s, c) => s + c.deductibles.reduce((ds, d) => ds + d.amount, 0),
      0,
    );
    const commissionNetPayable = Math.max(0, commissionGross - commissionDeductiblesTotal);
    const netEstimated = closing.finalPrice - commissionNetPayable;
    const allPaid =
      closing.commissions.length > 0 &&
      closing.commissions.every((c) => c.status === 'PAID');
    const anyPartial = closing.commissions.some((c) => c.status === 'PARTIAL');

    return {
      closingId: closing.id,
      finalPrice: closing.finalPrice,
      buyer: closing.buyer,
      property: closing.property,
      documentationCostsTotal: 0,
      commissionDeductiblesTotal,
      commissionGross,
      commissionNetPayable,
      commissionAmount: commissionNetPayable,
      commissionStatus: closing.commissions.length
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
