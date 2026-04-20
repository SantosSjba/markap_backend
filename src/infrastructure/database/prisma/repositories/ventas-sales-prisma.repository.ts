import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  VentasSalesRepository,
  ListSaleProcessesFilters,
  ListSaleSeparationsFilters,
  ListSaleClosingsFilters,
  VentasPipelineStage,
  VentasSaleProcessStatus,
  VentasSeparationStatus,
  VentasPaymentType,
} from '../../../../application/repositories/ventas-sales.repository';

@Injectable()
export class VentasSalesPrismaRepository implements VentasSalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextProcessCode(applicationId: string): Promise<string> {
    const n = await this.prisma.saleProcess.count({ where: { applicationId } });
    return `VNT-PRC-${String(n + 1).padStart(4, '0')}`;
  }

  async createSaleProcess(data: {
    applicationId: string;
    code: string;
    buyerClientId: string;
    propertyId: string;
    agentId?: string | null;
    pipelineStage: VentasPipelineStage;
    title?: string | null;
  }): Promise<{ id: string }> {
    const row = await this.prisma.saleProcess.create({
      data: {
        applicationId: data.applicationId,
        code: data.code,
        buyerClientId: data.buyerClientId,
        propertyId: data.propertyId,
        agentId: data.agentId ?? null,
        pipelineStage: data.pipelineStage,
        status: 'ACTIVE',
        title: data.title?.trim() || null,
      },
      select: { id: true },
    });
    return row;
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
        { property: { code: { contains: q } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.saleProcess.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true, primaryPhone: true } },
          property: { select: { id: true, code: true, addressLine: true, salePrice: true } },
          agent: { select: { id: true, fullName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleProcess.count({ where }),
    ]);
    return { data: rows as unknown[], total };
  }

  async getSaleProcessById(
    id: string,
    applicationId: string,
  ): Promise<unknown | null> {
    return this.prisma.saleProcess.findFirst({
      where: { id, applicationId, deletedAt: null },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            primaryPhone: true,
            primaryEmail: true,
            clientType: true,
          },
        },
        property: {
          select: {
            id: true,
            code: true,
            addressLine: true,
            salePrice: true,
            listingStatus: true,
          },
        },
        agent: { select: { id: true, fullName: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        reminders: { orderBy: { dueAt: 'asc' } },
        separations: {
          where: { status: { not: 'CLOSED' } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async updateSaleProcess(
    id: string,
    applicationId: string,
    data: {
      pipelineStage?: VentasPipelineStage;
      status?: VentasSaleProcessStatus;
      agentId?: string | null;
      title?: string | null;
      closedAt?: Date | null;
    },
  ): Promise<unknown> {
    return this.prisma.saleProcess.update({
      where: { id, applicationId },
      data: {
        ...(data.pipelineStage !== undefined && { pipelineStage: data.pipelineStage }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.agentId !== undefined && { agentId: data.agentId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.closedAt !== undefined && { closedAt: data.closedAt }),
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
      where: { id: data.saleProcessId, applicationId: data.applicationId, deletedAt: null },
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
      where: { id: data.saleProcessId, applicationId: data.applicationId, deletedAt: null },
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

    const [rows, total] = await Promise.all([
      this.prisma.saleSeparation.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true } },
          property: { select: { id: true, code: true, addressLine: true } },
          saleProcess: { select: { id: true, code: true } },
        },
        orderBy: { separationDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleSeparation.count({ where }),
    ]);
    return { data: rows as unknown[], total };
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
  }): Promise<{ id: string }> {
    const row = await this.prisma.$transaction(async (tx) => {
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
      await tx.property.update({
        where: { id: data.propertyId, applicationId: data.applicationId },
        data: { listingStatus: 'RESERVED' },
      });
      if (data.saleProcessId) {
        await tx.saleProcess.update({
          where: { id: data.saleProcessId, applicationId: data.applicationId },
          data: { pipelineStage: 'SEPARATION' },
        });
      }
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
      notes?: string | null;
      expiresAt?: Date | null;
    },
  ): Promise<unknown> {
    return this.prisma.saleSeparation.update({
      where: { id, applicationId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.receiptFilePath !== undefined && { receiptFilePath: data.receiptFilePath }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    });
  }

  async getSaleSeparationById(
    id: string,
    applicationId: string,
  ): Promise<unknown | null> {
    return this.prisma.saleSeparation.findFirst({
      where: { id, applicationId },
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

  async getSaleClosingById(
    closingId: string,
    applicationId: string,
  ): Promise<unknown | null> {
    return this.prisma.saleClosing.findFirst({
      where: { id: closingId, applicationId },
    });
  }

  async updateSaleClosingContractFile(
    closingId: string,
    applicationId: string,
    contractFilePath: string,
  ): Promise<unknown> {
    return this.prisma.saleClosing.update({
      where: { id: closingId, applicationId },
      data: { contractFilePath },
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
          property: { select: { id: true, code: true, addressLine: true } },
          agent: { select: { id: true, fullName: true } },
          commission: true,
        },
        orderBy: { closedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.saleClosing.count({ where }),
    ]);
    return { data: rows as unknown[], total };
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
    commissionAgentId: string;
    commissionAmount: number;
    commissionPercent?: number | null;
  }): Promise<{ closingId: string; commissionId: string }> {
    return this.prisma.$transaction(async (tx) => {
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

      const commission = await tx.saleCommission.create({
        data: {
          applicationId: data.applicationId,
          saleClosingId: closing.id,
          agentId: data.commissionAgentId,
          amount: data.commissionAmount,
          percentApplied: data.commissionPercent ?? null,
          status: 'PENDING',
        },
      });

      await tx.property.update({
        where: { id: data.propertyId, applicationId: data.applicationId },
        data: { listingStatus: 'SOLD' },
      });

      if (data.saleSeparationId) {
        await tx.saleSeparation.update({
          where: { id: data.saleSeparationId, applicationId: data.applicationId },
          data: { status: 'CLOSED' },
        });
      }

      if (data.saleProcessId) {
        await tx.saleProcess.update({
          where: { id: data.saleProcessId, applicationId: data.applicationId },
          data: {
            status: 'WON',
            pipelineStage: 'CLOSING',
            closedAt: new Date(),
          },
        });
      }

      return { closingId: closing.id, commissionId: commission.id };
    });
  }
}
