import { buildSaleProcessCode } from '../../../domain/utils/sale-process-code.util';
import { Injectable } from '@nestjs/common';
import { amountToNumber } from '../../../../../shared/domain/utils/amount-to-number.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  computeNetPayable,
  rebalanceCommissionPartsToNet,
  roundMoney,
  syncSaleCommissionStatus,
} from '../../../../../shared/utils/sale-commission.util';
import type {
  ListSaleClosingsFilters,
  ListSaleProcessesFilters,
  ListSaleSeparationsFilters,
  SaleProcessStats,
  SaleSeparationStats,
  VentasPaymentType,
  VentasPipelineStage,
  VentasSaleProcessStatus,
  VentasSalesRepository,
  VentasSalesUsage,
  VentasSeparationStatus,
} from '../../../domain/repositories/ventas-sales.repository';

@Injectable()
export class VentasSalesPrismaRepository implements VentasSalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesUsage(
    applicationId: string,
    ref: { propertyId?: string; clientId?: string; agentId?: string },
  ): Promise<VentasSalesUsage> {
    const live = { applicationId, deletedAt: null };
    const { propertyId, clientId, agentId } = ref;
    const processWhere = propertyId
      ? { ...live, propertyId }
      : clientId
        ? {
            ...live,
            OR: [
              { buyerClientId: clientId },
              { buyers: { some: { buyerClientId: clientId } } },
              { owners: { some: { ownerClientId: clientId } } },
            ],
          }
        : { ...live, agentId };
    const byRef = propertyId
      ? { propertyId }
      : clientId
        ? { buyerClientId: clientId }
        : { agentId };

    const [
      activeProcesses,
      activeSeparations,
      closings,
      openCommissions,
      paidParts,
    ] = await Promise.all([
      this.prisma.saleProcess.count({
        where: { ...processWhere, status: 'ACTIVE' },
      }),
      agentId
        ? Promise.resolve(0)
        : this.prisma.saleSeparation.count({
            where: { applicationId, status: 'ACTIVE', ...byRef },
          }),
      this.prisma.saleClosing.count({ where: { applicationId, ...byRef } }),
      agentId
        ? this.prisma.saleCommission.count({
            where: {
              applicationId,
              agentId,
              status: { in: ['PENDING', 'PARTIAL'] },
            },
          })
        : Promise.resolve(0),
      propertyId
        ? this.prisma.saleCommissionPaymentPart.count({
            where: {
              status: 'PAID',
              saleCommission: {
                saleProcess: {
                  ...live,
                  propertyId,
                  status: 'ACTIVE',
                },
              },
            },
          })
        : Promise.resolve(0),
    ]);
    return {
      activeProcesses,
      activeSeparations,
      closings,
      openCommissions,
      paidCommissionPartsOnActive: paidParts,
    };
  }

  async syncActiveProcessesWithProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<void> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, applicationId, deletedAt: null },
      select: {
        salePrice: true,
        saleCurrency: true,
        ownerId: true,
        owners: { select: { ownerClientId: true } },
      },
    });
    if (!property) return;
    const processes = await this.prisma.saleProcess.findMany({
      where: { propertyId, applicationId, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        commissions: {
          where: {
            saleClosingId: null,
            status: { notIn: ['CANCELLED'] },
          },
          include: { deductibles: true, paymentParts: true },
        },
      },
    });
    if (!processes.length) return;

    const ownerIds = Array.from(
      new Set(
        [
          property.ownerId,
          ...property.owners.map((o) => o.ownerClientId),
        ].filter(Boolean),
      ),
    );
    const price = amountToNumber(property.salePrice);

    await this.prisma.$transaction(async (tx) => {
      for (const proc of processes) {
        if (ownerIds.length) {
          await tx.saleProcessOwnerLink.deleteMany({
            where: {
              saleProcessId: proc.id,
              ownerClientId: { notIn: ownerIds },
            },
          });
          await tx.saleProcessOwnerLink.createMany({
            data: ownerIds.map((ownerClientId) => ({
              saleProcessId: proc.id,
              ownerClientId,
            })),
            skipDuplicates: true,
          });
        }

        for (const c of proc.commissions) {
          if (c.calculationType !== 'PERCENT' || c.percentApplied == null)
            continue;
          const hasPaid = c.paymentParts.some((p) => p.status === 'PAID');
          // Con cuotas pagadas la moneda ya no cambia (se bloquea al editar el inmueble)
          const currency = hasPaid ? c.currency : property.saleCurrency;
          const amount =
            price != null && price > 0
              ? roundMoney(price * (c.percentApplied / 100))
              : 0;
          const net = computeNetPayable(amount, c.deductibles);
          const paidSum = c.paymentParts
            .filter((p) => p.status === 'PAID')
            .reduce((acc, p) => acc + p.amount, 0);
          if (net + 0.01 < paidSum) continue;
          if (amount === c.amount && currency === c.currency) continue;
          await tx.saleCommission.update({
            where: { id: c.id },
            data: { amount, currency },
          });
          await rebalanceCommissionPartsToNet(tx, c.id, net);
          await syncSaleCommissionStatus(tx, c.id);
        }
      }
    });
  }

  async nextProcessCode(
    applicationId: string,
    propertyCode: string,
    year: number,
  ): Promise<string> {
    const base = buildSaleProcessCode(propertyCode, year, []);
    const used = await this.prisma.saleProcess.findMany({
      where: { applicationId, code: { startsWith: base } },
      select: { code: true },
    });
    return buildSaleProcessCode(
      propertyCode,
      year,
      used.map((u) => u.code),
    );
  }

  async createSaleProcess(data: {
    applicationId: string;
    code: string;
    buyerClientId: string;
    buyerClientIds?: string[];
    propertyId: string;
    ownerClientIds?: string[];
    agentId?: string | null;
    pipelineStage: VentasPipelineStage;
    title?: string | null;
    financingChannelId?: string | null;
    commissions?: {
      agentId: string;
      calculationType: 'PERCENT' | 'FIXED';
      amount: number;
      currency: string;
      percentApplied?: number | null;
      paymentParts?: {
        partNumber: number;
        label: string | null;
        amount: number;
        dueDate: Date | null;
      }[];
      deductibles?: {
        deductibleType: string;
        description: string | null;
        amount: number;
      }[];
    }[];
  }): Promise<{ id: string }> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.saleProcess.create({
        data: {
          applicationId: data.applicationId,
          code: data.code,
          buyerClientId: data.buyerClientId,
          propertyId: data.propertyId,
          agentId: data.agentId ?? null,
          pipelineStage: data.pipelineStage,
          status: 'ACTIVE',
          title: data.title?.trim() || null,
          financingChannelId: data.financingChannelId ?? null,
        },
        select: { id: true },
      });

      const buyers = Array.from(
        new Set(
          [data.buyerClientId, ...(data.buyerClientIds ?? [])].filter(Boolean),
        ),
      );
      if (buyers.length) {
        await tx.saleProcessBuyerLink.createMany({
          data: buyers.map((buyerId) => ({
            saleProcessId: created.id,
            buyerClientId: buyerId,
            isPrimary: buyerId === data.buyerClientId,
          })),
        });
      }

      const owners = Array.from(
        new Set((data.ownerClientIds ?? []).filter(Boolean)),
      );
      if (owners.length) {
        await tx.saleProcessOwnerLink.createMany({
          data: owners.map((ownerId) => ({
            saleProcessId: created.id,
            ownerClientId: ownerId,
          })),
        });
      }

      if (data.commissions?.length) {
        for (const c of data.commissions) {
          const commission = await tx.saleCommission.create({
            data: {
              applicationId: data.applicationId,
              saleProcessId: created.id,
              agentId: c.agentId,
              calculationType: c.calculationType,
              amount: c.amount,
              currency: c.currency,
              percentApplied: c.percentApplied ?? null,
              status: 'PENDING',
            },
          });
          if (c.paymentParts?.length) {
            await tx.saleCommissionPaymentPart.createMany({
              data: c.paymentParts.map((p) => ({
                saleCommissionId: commission.id,
                partNumber: p.partNumber,
                label: p.label,
                amount: p.amount,
                dueDate: p.dueDate,
                status: 'PENDING',
              })),
            });
          }
          if (c.deductibles?.length) {
            await tx.saleCommissionDeductible.createMany({
              data: c.deductibles.map((d) => ({
                saleCommissionId: commission.id,
                deductibleType: d.deductibleType,
                description: d.description,
                amount: d.amount,
              })),
            });
          }
        }
      }

      return created;
    });
    return row;
  }

  async countProcessCommissions(
    saleProcessId: string,
    applicationId: string,
  ): Promise<number> {
    return this.prisma.saleCommission.count({
      where: {
        saleProcessId,
        applicationId,
        status: { notIn: ['CANCELLED'] },
      },
    });
  }

  async getSaleProcessStats(applicationId: string): Promise<SaleProcessStats> {
    const base = { applicationId, deletedAt: null };
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [byStatus, byStage, createdThisMonth, activeRows] = await Promise.all(
      [
        this.prisma.saleProcess.groupBy({
          by: ['status'],
          where: base,
          _count: { _all: true },
        }),
        this.prisma.saleProcess.groupBy({
          by: ['pipelineStage'],
          where: { ...base, status: 'ACTIVE' },
          _count: { _all: true },
        }),
        this.prisma.saleProcess.count({
          where: { ...base, createdAt: { gte: monthStart } },
        }),
        this.prisma.saleProcess.findMany({
          where: { ...base, status: 'ACTIVE' },
          select: {
            property: { select: { salePrice: true, saleCurrency: true } },
          },
        }),
      ],
    );
    const countOf = (status: string) =>
      byStatus.find((g) => g.status === status)?._count._all ?? 0;
    const value = new Map<string, { amount: number; count: number }>();
    for (const r of activeRows) {
      const price = amountToNumber(r.property?.salePrice);
      if (price == null) continue;
      const cur = r.property?.saleCurrency ?? 'PEN';
      const acc = value.get(cur) ?? { amount: 0, count: 0 };
      value.set(cur, { amount: acc.amount + price, count: acc.count + 1 });
    }
    return {
      total: byStatus.reduce((s, g) => s + g._count._all, 0),
      active: countOf('ACTIVE'),
      won: countOf('WON'),
      lost: countOf('LOST'),
      createdThisMonth,
      activeByStage: Object.fromEntries(
        byStage.map((g) => [g.pipelineStage, g._count._all]),
      ),
      activeValueByCurrency: [...value.entries()]
        .map(([currency, v]) => ({
          currency,
          amount: Math.round(v.amount * 100) / 100,
          count: v.count,
        }))
        .sort((a, b) =>
          a.currency === 'PEN'
            ? -1
            : b.currency === 'PEN'
              ? 1
              : a.currency.localeCompare(b.currency),
        ),
    };
  }

  async listSaleProcesses(
    filters: ListSaleProcessesFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where: Record<string, unknown> = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.pipelineStage) where.pipelineStage = filters.pipelineStage;
    if (filters.status) where.status = filters.status;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q } },
        { title: { contains: q } },
        { buyer: { fullName: { contains: q } } },
        { buyers: { some: { buyer: { fullName: { contains: q } } } } },
        { owners: { some: { owner: { fullName: { contains: q } } } } },
        { property: { code: { contains: q } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleProcess.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true, primaryPhone: true } },
          buyers: {
            include: {
              buyer: {
                select: { id: true, fullName: true, primaryPhone: true },
              },
            },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
          owners: {
            include: { owner: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
          },
          property: {
            select: {
              id: true,
              code: true,
              addressLine: true,
              salePrice: true,
              saleCurrency: true,
              projectName: true,
              listingStatus: true,
              area: true,
              propertyType: { select: { name: true } },
            },
          },
          agent: { select: { id: true, fullName: true } },
          financingChannel: {
            select: { id: true, code: true, name: true, category: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleProcess.count({ where }),
    ]);
    return {
      data: rows.map((row) => {
        const buyers: {
          isPrimary: boolean;
          buyer: { id: string; fullName: string; primaryPhone: string | null };
        }[] =
          row.buyers.length > 0
            ? row.buyers
            : row.buyer
              ? [{ isPrimary: true as const, buyer: row.buyer }]
              : [];
        return {
          ...row,
          // Participantes planos, como en el detalle
          buyers: buyers.map((b) => ({ ...b.buyer, isPrimary: b.isPrimary })),
          owners: row.owners.map((o) => ({
            id: o.owner.id,
            fullName: o.owner.fullName,
          })),
          property: row.property
            ? {
                ...row.property,
                propertyType: undefined,
                propertyTypeName: row.property.propertyType?.name ?? null,
                salePrice: amountToNumber(row.property.salePrice),
              }
            : row.property,
        };
      }),
      total,
    };
  }

  async ensureSaleProcessOwnerLinksFromProperty(
    saleProcessId: string,
    propertyId: string,
  ): Promise<void> {
    const existing = await this.prisma.saleProcessOwnerLink.count({
      where: { saleProcessId },
    });
    if (existing > 0) return;

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: {
        ownerId: true,
        owners: { select: { ownerClientId: true } },
      },
    });
    if (!property) return;

    const ownerClientIds = Array.from(
      new Set(
        [
          property.ownerId,
          ...property.owners.map((o) => o.ownerClientId),
        ].filter(Boolean),
      ),
    );
    if (!ownerClientIds.length) return;

    await this.prisma.saleProcessOwnerLink.createMany({
      data: ownerClientIds.map((ownerClientId) => ({
        saleProcessId,
        ownerClientId,
      })),
      skipDuplicates: true,
    });
  }

  async getSaleProcessById(
    id: string,
    applicationId: string,
  ): Promise<unknown> {
    return this.prisma.saleProcess.findFirst({
      where: { id, applicationId, deletedAt: null },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            documentNumber: true,
            primaryPhone: true,
            primaryEmail: true,
            clientType: true,
            documentType: { select: { name: true } },
          },
        },
        buyers: {
          include: {
            buyer: {
              select: {
                id: true,
                fullName: true,
                documentNumber: true,
                primaryPhone: true,
                primaryEmail: true,
                clientType: true,
                documentType: { select: { name: true } },
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        owners: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                documentNumber: true,
                primaryPhone: true,
                primaryEmail: true,
                clientType: true,
                documentType: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        property: {
          select: {
            id: true,
            code: true,
            addressLine: true,
            salePrice: true,
            saleCurrency: true,
            projectName: true,
            listingStatus: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            ownerId: true,
            propertyType: { select: { name: true } },
            owner: {
              select: {
                id: true,
                fullName: true,
                documentNumber: true,
                primaryPhone: true,
                primaryEmail: true,
                clientType: true,
                documentType: { select: { name: true } },
              },
            },
            owners: {
              include: {
                owner: {
                  select: {
                    id: true,
                    fullName: true,
                    documentNumber: true,
                    primaryPhone: true,
                    primaryEmail: true,
                    clientType: true,
                    documentType: { select: { name: true } },
                  },
                },
              },
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            },
            district: {
              select: {
                name: true,
                province: {
                  select: {
                    name: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        financingChannel: {
          select: { id: true, code: true, name: true, category: true },
        },
        agent: { select: { id: true, fullName: true } },
        commissions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            calculationType: true,
            percentApplied: true,
            status: true,
            paidAt: true,
            saleClosingId: true,
            agent: { select: { id: true, fullName: true, type: true } },
            paymentParts: { orderBy: { partNumber: 'asc' } },
            deductibles: { orderBy: { createdAt: 'asc' } },
          },
        },
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        reminders: { orderBy: { dueAt: 'asc' } },
        // Historial completo (incluye las cerradas en venta) para la ficha del proceso
        separations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // Cierre del proceso: la ficha del proceso es el centro de la venta
        closings: {
          orderBy: { closedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            finalPrice: true,
            paymentType: true,
            closedAt: true,
            notes: true,
            contractFilePath: true,
            contractArchivoId: true,
            saleSeparationId: true,
          },
        },
      },
    });
  }

  private saleProcessPatch(data: {
    pipelineStage?: VentasPipelineStage;
    status?: VentasSaleProcessStatus;
    agentId?: string | null;
    title?: string | null;
    financingChannelId?: string | null;
    closedAt?: Date | null;
    lostReason?: string | null;
  }) {
    return {
      ...(data.pipelineStage !== undefined && {
        pipelineStage: data.pipelineStage,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.agentId !== undefined && { agentId: data.agentId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.financingChannelId !== undefined && {
        financingChannelId: data.financingChannelId,
      }),
      ...(data.closedAt !== undefined && { closedAt: data.closedAt }),
      ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
    };
  }

  async updateSaleProcess(
    id: string,
    applicationId: string,
    data: Parameters<VentasSalesPrismaRepository['saleProcessPatch']>[0],
    activity?: { title: string; description: string },
  ): Promise<unknown> {
    if (!activity) {
      return this.prisma.saleProcess.update({
        where: { id, applicationId },
        data: this.saleProcessPatch(data),
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.saleProcess.update({
        where: { id, applicationId },
        data: this.saleProcessPatch(data),
      });
      await tx.saleProcessActivity.create({
        data: {
          saleProcessId: id,
          activityType: 'OTHER',
          title: activity.title,
          description: activity.description,
          completedAt: new Date(),
        },
      });
      return updated;
    });
  }

  async cancelProcessCommissions(
    saleProcessId: string,
    applicationId: string,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.saleCommission.findMany({
        where: {
          saleProcessId,
          applicationId,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        include: { paymentParts: { select: { status: true } } },
      });
      let count = 0;
      for (const row of rows) {
        const hasPaidPart = row.paymentParts.some((p) => p.status === 'PAID');
        if (hasPaidPart) continue;
        await tx.saleCommission.update({
          where: { id: row.id },
          data: { status: 'CANCELLED', paidAt: null },
        });
        count += 1;
      }
      return count;
    });
  }

  async applySaleProcessLost(
    saleProcessId: string,
    applicationId: string,
    data: { lostReason: string; closedAt: Date; activityDescription: string },
  ): Promise<unknown> {
    const applied = await this.prisma.$transaction(async (tx) => {
      const proc = await tx.saleProcess.findFirst({
        where: { id: saleProcessId, applicationId, deletedAt: null },
      });
      if (!proc || proc.status !== 'ACTIVE') return false;

      await tx.saleProcess.update({
        where: { id: saleProcessId },
        data: {
          status: 'LOST',
          lostReason: data.lostReason,
          closedAt: data.closedAt,
        },
      });

      const commissions = await tx.saleCommission.findMany({
        where: {
          saleProcessId,
          applicationId,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        include: { paymentParts: { select: { status: true } } },
      });
      for (const row of commissions) {
        const hasPaidPart = row.paymentParts.some((p) => p.status === 'PAID');
        if (hasPaidPart) continue;
        await tx.saleCommission.update({
          where: { id: row.id },
          data: { status: 'CANCELLED', paidAt: null },
        });
      }

      // La separación vigente cae con la venta y el inmueble vuelve a estar disponible
      const expired = await tx.saleSeparation.updateMany({
        where: { saleProcessId, applicationId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
      if (expired.count > 0) {
        const stillActive = await tx.saleSeparation.count({
          where: {
            propertyId: proc.propertyId,
            applicationId,
            status: 'ACTIVE',
          },
        });
        if (stillActive === 0) {
          await tx.property.updateMany({
            where: {
              id: proc.propertyId,
              applicationId,
              listingStatus: 'RESERVED',
            },
            data: { listingStatus: 'AVAILABLE' },
          });
        }
      }

      await tx.saleProcessActivity.create({
        data: {
          saleProcessId,
          activityType: 'OTHER',
          title: 'Venta caída',
          description: data.activityDescription,
          completedAt: new Date(),
        },
      });

      return true;
    });

    if (!applied) return null;
    return this.getSaleProcessById(saleProcessId, applicationId);
  }

  async listSaleFinancingChannels(): Promise<unknown[]> {
    return this.prisma.saleFinancingChannel.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        sortOrder: true,
      },
    });
  }

  async addSaleProcessNote(
    saleProcessId: string,
    applicationId: string,
    body: string,
    createdBy?: string | null,
  ): Promise<unknown> {
    const p = await this.prisma.saleProcess.findFirst({
      where: { id: saleProcessId, applicationId, deletedAt: null },
    });
    if (!p) return null;
    return this.prisma.saleProcessNote.create({
      data: {
        saleProcessId,
        body: body.trim(),
        createdBy: createdBy ?? null,
      },
    });
  }

  async addSaleProcessActivity(data: {
    saleProcessId: string;
    applicationId: string;
    activityType: string;
    title: string;
    description?: string | null;
    scheduledAt?: Date | null;
    completedAt?: Date | null;
  }): Promise<unknown> {
    const p = await this.prisma.saleProcess.findFirst({
      where: {
        id: data.saleProcessId,
        applicationId: data.applicationId,
        deletedAt: null,
      },
    });
    if (!p) return null;
    return this.prisma.saleProcessActivity.create({
      data: {
        saleProcessId: data.saleProcessId,
        activityType: data.activityType,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        scheduledAt: data.scheduledAt ?? null,
        completedAt: data.completedAt ?? null,
      },
    });
  }

  async addSaleProcessReminder(data: {
    saleProcessId: string;
    applicationId: string;
    title: string;
    dueAt: Date;
  }): Promise<unknown> {
    const p = await this.prisma.saleProcess.findFirst({
      where: {
        id: data.saleProcessId,
        applicationId: data.applicationId,
        deletedAt: null,
      },
    });
    if (!p) return null;
    return this.prisma.saleProcessReminder.create({
      data: {
        saleProcessId: data.saleProcessId,
        title: data.title.trim(),
        dueAt: data.dueAt,
      },
    });
  }

  async completeSaleProcessReminder(
    reminderId: string,
    applicationId: string,
  ): Promise<unknown> {
    const r = await this.prisma.saleProcessReminder.findFirst({
      where: {
        id: reminderId,
        saleProcess: { is: { applicationId, deletedAt: null } },
      },
    });
    if (!r) return null;
    return this.prisma.saleProcessReminder.update({
      where: { id: reminderId },
      data: { completedAt: new Date() },
    });
  }

  async listSaleSeparations(
    filters: ListSaleSeparationsFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where: Record<string, unknown> = { applicationId: app.id };
    if (filters.status) where.status = filters.status;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { buyer: { fullName: { contains: q, mode: 'insensitive' } } },
        { buyer: { documentNumber: { contains: q } } },
        { property: { code: { contains: q, mode: 'insensitive' } } },
        { property: { addressLine: { contains: q, mode: 'insensitive' } } },
        { saleProcess: { code: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleSeparation.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              documentNumber: true,
              primaryPhone: true,
            },
          },
          property: {
            select: {
              id: true,
              code: true,
              addressLine: true,
              salePrice: true,
              saleCurrency: true,
              listingStatus: true,
              propertyType: { select: { name: true } },
            },
          },
          saleProcess: {
            select: { id: true, code: true, pipelineStage: true, status: true },
          },
          closing: { select: { id: true, closedAt: true } },
        },
        orderBy: { separationDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleSeparation.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        ...r,
        property: {
          ...r.property,
          propertyType: undefined,
          propertyTypeName: r.property.propertyType?.name ?? null,
          salePrice: amountToNumber(r.property.salePrice),
        },
      })),
      total,
    };
  }

  async getSaleSeparationStats(
    applicationId: string,
  ): Promise<SaleSeparationStats> {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const [byStatus, expiringSoon, activeByCurrency] = await Promise.all([
      this.prisma.saleSeparation.groupBy({
        by: ['status'],
        where: { applicationId },
        _count: { _all: true },
      }),
      this.prisma.saleSeparation.count({
        where: { applicationId, status: 'ACTIVE', expiresAt: { lte: soon } },
      }),
      this.prisma.saleSeparation.groupBy({
        by: ['currency'],
        where: { applicationId, status: 'ACTIVE' },
        _sum: { amount: true },
      }),
    ]);
    const countOf = (status: string) =>
      byStatus.find((g) => g.status === status)?._count._all ?? 0;
    return {
      active: countOf('ACTIVE'),
      expired: countOf('EXPIRED'),
      closed: countOf('CLOSED'),
      expiringSoon,
      activeAmountByCurrency: activeByCurrency
        .map((g) => ({
          currency: g.currency,
          amount: Math.round((g._sum.amount ?? 0) * 100) / 100,
        }))
        .sort((a, b) =>
          a.currency === 'PEN'
            ? -1
            : b.currency === 'PEN'
              ? 1
              : a.currency.localeCompare(b.currency),
        ),
    };
  }

  async findActiveProcessForSeparation(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.saleProcess.findFirst({
      where: {
        applicationId,
        propertyId,
        status: 'ACTIVE',
        deletedAt: null,
        OR: [{ buyerClientId }, { buyers: { some: { buyerClientId } } }],
      },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSaleSeparation(data: {
    applicationId: string;
    saleProcessId?: string | null;
    propertyId: string;
    buyerClientId: string;
    amount: number;
    currency: string;
    separationDate: Date;
    expiresAt?: Date | null;
    notes?: string | null;
  }): Promise<{ id: string } | null> {
    const row = await this.prisma.$transaction(async (tx) => {
      const lock = await tx.property.updateMany({
        where: {
          id: data.propertyId,
          applicationId: data.applicationId,
          deletedAt: null,
          listingStatus: 'AVAILABLE',
        },
        data: { listingStatus: 'RESERVED' },
      });
      if (lock.count === 0) {
        return null;
      }

      const sep = await tx.saleSeparation.create({
        data: {
          applicationId: data.applicationId,
          saleProcessId: data.saleProcessId ?? null,
          propertyId: data.propertyId,
          buyerClientId: data.buyerClientId,
          amount: data.amount,
          currency: data.currency,
          separationDate: data.separationDate,
          expiresAt: data.expiresAt ?? null,
          status: 'ACTIVE',
          notes: data.notes?.trim() || null,
        },
        select: { id: true },
      });
      return sep;
    });
    return row;
  }

  async updateSaleSeparation(
    id: string,
    applicationId: string,
    data: {
      status?: VentasSeparationStatus;
      receiptFilePath?: string | null;
      receiptArchivoId?: string | null;
      notes?: string | null;
      expiresAt?: Date | null;
    },
  ): Promise<unknown> {
    return this.prisma.saleSeparation.update({
      where: { id, applicationId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.receiptFilePath !== undefined && {
          receiptFilePath: data.receiptFilePath,
        }),
        ...(data.receiptArchivoId !== undefined && {
          receiptArchivoId: data.receiptArchivoId,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    });
  }

  async getSaleSeparationById(
    id: string,
    applicationId: string,
  ): Promise<unknown> {
    return this.prisma.saleSeparation.findFirst({
      where: { id, applicationId },
    });
  }

  async listActiveSeparationsOnProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<{ id: string; buyerClientId: string }[]> {
    return this.prisma.saleSeparation.findMany({
      where: { propertyId, applicationId, status: 'ACTIVE' },
      select: { id: true, buyerClientId: true },
    });
  }

  async countActiveSeparationsOnProperty(
    propertyId: string,
    applicationId: string,
  ): Promise<number> {
    return this.prisma.saleSeparation.count({
      where: {
        propertyId,
        applicationId,
        status: 'ACTIVE',
      },
    });
  }

  async refreshPropertyListingAfterSeparationChange(
    propertyId: string,
    applicationId: string,
  ): Promise<void> {
    const active = await this.countActiveSeparationsOnProperty(
      propertyId,
      applicationId,
    );
    if (active === 0) {
      const prop = await this.prisma.property.findFirst({
        where: { id: propertyId, applicationId, deletedAt: null },
      });
      if (prop && prop.listingStatus === 'RESERVED') {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { listingStatus: 'AVAILABLE' },
        });
      }
    }
  }

  async ensurePropertyReservedForSeparation(
    propertyId: string,
    applicationId: string,
  ): Promise<boolean> {
    const prop = await this.prisma.property.findFirst({
      where: { id: propertyId, applicationId, deletedAt: null },
      select: { listingStatus: true },
    });
    if (!prop || prop.listingStatus === 'SOLD') return false;
    if (prop.listingStatus === 'RESERVED') return true;

    const updated = await this.prisma.property.updateMany({
      where: {
        id: propertyId,
        applicationId,
        deletedAt: null,
        listingStatus: 'AVAILABLE',
      },
      data: { listingStatus: 'RESERVED' },
    });
    return updated.count > 0;
  }

  async getSaleClosingById(
    closingId: string,
    applicationId: string,
  ): Promise<unknown> {
    return this.prisma.saleClosing.findFirst({
      where: { id: closingId, applicationId },
    });
  }

  async updateSaleClosingContractFile(
    closingId: string,
    applicationId: string,
    file: { filePath: string; archivoId?: string | null },
  ): Promise<unknown> {
    return this.prisma.saleClosing.update({
      where: { id: closingId, applicationId },
      data: {
        contractFilePath: file.filePath,
        contractArchivoId: file.archivoId ?? null,
      },
    });
  }

  async listSaleClosings(
    filters: ListSaleClosingsFilters,
  ): Promise<{ data: unknown[]; total: number }> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0 };

    const where = { applicationId: app.id };

    const [rows, total] = await Promise.all([
      this.prisma.saleClosing.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true } },
          property: {
            select: {
              id: true,
              code: true,
              addressLine: true,
              saleCurrency: true,
            },
          },
          agent: { select: { id: true, fullName: true } },
          commissions: true,
        },
        orderBy: { closedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleClosing.count({ where }),
    ]);
    const data = rows.map((row) => {
      const r = row as { commissions?: { amount: number; status: string }[] };
      return {
        ...row,
        commission: r.commissions?.[0] ?? null,
        commissionsTotal: (r.commissions ?? []).reduce(
          (s, c) => s + c.amount,
          0,
        ),
      };
    });
    return { data: data, total };
  }

  async createSaleClosingWithSideEffects(data: {
    applicationId: string;
    saleProcessId?: string | null;
    saleSeparationId?: string | null;
    propertyId: string;
    buyerClientId: string;
    agentId?: string | null;
    finalPrice: number;
    paymentType: VentasPaymentType;
    contractFilePath?: string | null;
    notes?: string | null;
    commissionAgentId?: string | null;
    commissionAmount: number;
    commissionPercent?: number | null;
  }): Promise<{ closingId: string; commissionId: string } | null> {
    return this.prisma.$transaction(async (tx) => {
      const lock = await tx.property.updateMany({
        where: {
          id: data.propertyId,
          applicationId: data.applicationId,
          deletedAt: null,
          listingStatus: { in: ['AVAILABLE', 'RESERVED'] },
        },
        data: { listingStatus: 'SOLD' },
      });
      if (lock.count === 0) {
        return null;
      }

      const closing = await tx.saleClosing.create({
        data: {
          applicationId: data.applicationId,
          saleProcessId: data.saleProcessId ?? null,
          saleSeparationId: data.saleSeparationId ?? null,
          propertyId: data.propertyId,
          buyerClientId: data.buyerClientId,
          agentId: data.agentId ?? null,
          finalPrice: data.finalPrice,
          paymentType: data.paymentType,
          contractFilePath: data.contractFilePath ?? null,
          notes: data.notes?.trim() || null,
        },
      });

      let commissionId: string;
      const processCommissions =
        data.saleProcessId != null
          ? await tx.saleCommission.findMany({
              where: {
                saleProcessId: data.saleProcessId,
                applicationId: data.applicationId,
                status: { notIn: ['CANCELLED'] },
              },
            })
          : [];

      if (processCommissions.length > 0) {
        for (const row of processCommissions) {
          let amount = row.amount;
          if (row.calculationType === 'PERCENT' && row.percentApplied != null) {
            amount =
              Math.round(data.finalPrice * (row.percentApplied / 100) * 100) /
              100;
          }
          const deductibles = await tx.saleCommissionDeductible.findMany({
            where: { saleCommissionId: row.id },
          });
          const net = computeNetPayable(amount, deductibles);
          await tx.saleCommission.update({
            where: { id: row.id },
            data: { saleClosingId: closing.id, amount },
          });
          // Con el precio final cambia el neto: las cuotas ya pagadas no se tocan
          await rebalanceCommissionPartsToNet(tx, row.id, net);
          await syncSaleCommissionStatus(tx, row.id);
        }
        commissionId = processCommissions[0].id;
      } else if (data.commissionAgentId) {
        const closedProperty = await tx.property.findUnique({
          where: { id: data.propertyId },
          select: { saleCurrency: true },
        });
        const created = await tx.saleCommission.create({
          data: {
            applicationId: data.applicationId,
            saleClosingId: closing.id,
            agentId: data.commissionAgentId,
            currency: closedProperty?.saleCurrency ?? 'PEN',
            calculationType:
              data.commissionPercent != null ? 'PERCENT' : 'FIXED',
            amount: data.commissionAmount,
            percentApplied: data.commissionPercent ?? null,
            status: 'PENDING',
          },
        });
        commissionId = created.id;
      } else {
        commissionId = '';
      }

      if (data.saleSeparationId) {
        await tx.saleSeparation.update({
          where: {
            id: data.saleSeparationId,
            applicationId: data.applicationId,
          },
          data: { status: 'CLOSED' },
        });
      }

      if (data.saleProcessId) {
        await tx.saleProcess.update({
          where: { id: data.saleProcessId, applicationId: data.applicationId },
          data: {
            status: 'WON',
            pipelineStage: 'PUBLIC_DEED',
            closedAt: new Date(),
          },
        });
      }

      // Inmueble vendido: las demás negociaciones sobre él ya no pueden continuar
      await tx.saleSeparation.updateMany({
        where: {
          propertyId: data.propertyId,
          applicationId: data.applicationId,
          status: 'ACTIVE',
        },
        data: { status: 'EXPIRED' },
      });
      const others = await tx.saleProcess.findMany({
        where: {
          propertyId: data.propertyId,
          applicationId: data.applicationId,
          status: 'ACTIVE',
          deletedAt: null,
          ...(data.saleProcessId ? { id: { not: data.saleProcessId } } : {}),
        },
        select: { id: true },
      });
      const wonCode = data.saleProcessId
        ? (
            await tx.saleProcess.findUnique({
              where: { id: data.saleProcessId },
              select: { code: true },
            })
          )?.code
        : null;
      const reason = wonCode
        ? `El inmueble se vendió en el proceso ${wonCode}.`
        : 'El inmueble se vendió en otro cierre.';
      for (const other of others) {
        await tx.saleProcess.update({
          where: { id: other.id },
          data: { status: 'LOST', lostReason: reason, closedAt: new Date() },
        });
        const open = await tx.saleCommission.findMany({
          where: {
            saleProcessId: other.id,
            status: { notIn: ['PAID', 'CANCELLED'] },
          },
          include: { paymentParts: { select: { status: true } } },
        });
        for (const c of open) {
          if (c.paymentParts.some((p) => p.status === 'PAID')) continue;
          await tx.saleCommission.update({
            where: { id: c.id },
            data: { status: 'CANCELLED', paidAt: null },
          });
        }
        await tx.saleProcessActivity.create({
          data: {
            saleProcessId: other.id,
            activityType: 'OTHER',
            title: 'Venta caída',
            description: reason,
            completedAt: new Date(),
          },
        });
      }

      return { closingId: closing.id, commissionId };
    });
  }
}
