import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateInteriorProjectData,
  InteriorProjectDetail,
  InteriorProjectRepository,
  ListInteriorProjectsFilters,
  ListInteriorProjectsResult,
  UpdateInteriorProjectData,
} from '@domain/repositories/interior-project.repository';

const IN_PROGRESS_STATUSES = ['DESIGN', 'QUOTE', 'APPROVED', 'IN_PROGRESS'] as const;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class InteriorProjectPrismaRepository implements InteriorProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: ListInteriorProjectsFilters): Promise<ListInteriorProjectsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Record<string, unknown>[] = [
      { applicationId: app.id, deletedAt: null },
    ];

    if (filters.inProgressOnly) {
      andParts.push({ status: { in: [...IN_PROGRESS_STATUSES] } });
    }
    if (filters.clientId?.trim()) {
      andParts.push({ clientId: filters.clientId.trim() });
    }
    if (filters.status) {
      andParts.push({ status: filters.status });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorProject.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, documentNumber: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.interiorProject.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        projectType: r.projectType as InteriorProjectDetail['projectType'],
        status: r.status as InteriorProjectDetail['status'],
        progressPct: num(r.progressPct) ?? 0,
        estimatedEndDate: r.estimatedEndDate
          ? r.estimatedEndDate.toISOString().slice(0, 10)
          : null,
        client: {
          id: r.client.id,
          fullName: r.client.fullName,
          documentNumber: r.client.documentNumber,
        },
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<InteriorProjectDetail | null> {
    const whereBase: Record<string, unknown> = { id, deletedAt: null };
    if (applicationSlug?.trim()) {
      const app = await this.prisma.application.findUnique({
        where: { slug: applicationSlug.trim() },
      });
      if (!app) return null;
      whereBase.applicationId = app.id;
    }

    const row = await this.prisma.interiorProject.findFirst({
      where: whereBase as never,
      include: {
        client: { select: { id: true, fullName: true, documentNumber: true } },
        designerAgent: { select: { id: true, fullName: true } },
        architectAgent: { select: { id: true, fullName: true } },
        supervisorAgent: { select: { id: true, fullName: true } },
        commercialAgent: { select: { id: true, fullName: true } },
        budgets: { orderBy: [{ code: 'asc' }, { version: 'desc' }] },
        materials: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        activities: { orderBy: { occurredAt: 'desc' } },
        milestones: { orderBy: { plannedDate: 'asc' } },
      },
    });

    if (!row) return null;

    return this.mapDetail(row);
  }

  async create(data: CreateInteriorProjectData): Promise<InteriorProjectDetail> {
    const row = await this.prisma.interiorProject.create({
      data: {
        applicationId: data.applicationId,
        code: data.code.trim(),
        name: data.name.trim(),
        clientId: data.clientId,
        projectType: data.projectType,
        status: data.status,
        addressLine: data.addressLine?.trim() || null,
        areaSqm: data.areaSqm ?? null,
        levelsCount: data.levelsCount ?? null,
        environmentsNote: data.environmentsNote?.trim() || null,
        startDate: data.startDate ?? null,
        estimatedEndDate: data.estimatedEndDate ?? null,
        designerAgentId: data.designerAgentId ?? null,
        architectAgentId: data.architectAgentId ?? null,
        supervisorAgentId: data.supervisorAgentId ?? null,
        commercialAgentId: data.commercialAgentId ?? null,
        estimatedBudget: data.estimatedBudget ?? null,
        projectedCost: data.projectedCost ?? null,
        expectedMargin: data.expectedMargin ?? null,
        progressPct: data.progressPct ?? 0,
      },
    });
    const detail = await this.findById(row.id);
    if (!detail) throw new Error('InteriorProject create: detail not found');
    return detail;
  }

  async update(id: string, data: UpdateInteriorProjectData): Promise<InteriorProjectDetail> {
    const patch: Prisma.InteriorProjectUncheckedUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.clientId !== undefined) patch.clientId = data.clientId;
    if (data.projectType !== undefined) patch.projectType = data.projectType;
    if (data.status !== undefined) patch.status = data.status;
    if (data.addressLine !== undefined) patch.addressLine = data.addressLine?.trim() || null;
    if (data.areaSqm !== undefined) {
      patch.areaSqm =
        data.areaSqm === null ? null : new Prisma.Decimal(data.areaSqm);
    }
    if (data.levelsCount !== undefined) patch.levelsCount = data.levelsCount;
    if (data.environmentsNote !== undefined) {
      patch.environmentsNote = data.environmentsNote?.trim() || null;
    }
    if (data.startDate !== undefined) patch.startDate = data.startDate;
    if (data.estimatedEndDate !== undefined) patch.estimatedEndDate = data.estimatedEndDate;
    if (data.designerAgentId !== undefined) patch.designerAgentId = data.designerAgentId;
    if (data.architectAgentId !== undefined) patch.architectAgentId = data.architectAgentId;
    if (data.supervisorAgentId !== undefined) patch.supervisorAgentId = data.supervisorAgentId;
    if (data.commercialAgentId !== undefined) patch.commercialAgentId = data.commercialAgentId;
    if (data.estimatedBudget !== undefined) {
      patch.estimatedBudget =
        data.estimatedBudget === null
          ? null
          : new Prisma.Decimal(data.estimatedBudget);
    }
    if (data.projectedCost !== undefined) {
      patch.projectedCost =
        data.projectedCost === null ? null : new Prisma.Decimal(data.projectedCost);
    }
    if (data.expectedMargin !== undefined) {
      patch.expectedMargin =
        data.expectedMargin === null ? null : new Prisma.Decimal(data.expectedMargin);
    }
    if (data.progressPct !== undefined && data.progressPct !== null) {
      patch.progressPct = new Prisma.Decimal(data.progressPct);
    }

    await this.prisma.interiorProject.update({
      where: { id },
      data: patch,
    });
    const detail = await this.findById(id);
    if (!detail) throw new Error('InteriorProject update: detail not found');
    return detail;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDetail(row: any): InteriorProjectDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      projectType: row.projectType,
      status: row.status,
      progressPct: num(row.progressPct) ?? 0,
      estimatedEndDate: row.estimatedEndDate
        ? row.estimatedEndDate.toISOString().slice(0, 10)
        : null,
      client: {
        id: row.client.id,
        fullName: row.client.fullName,
        documentNumber: row.client.documentNumber,
      },
      addressLine: row.addressLine ?? null,
      areaSqm: num(row.areaSqm),
      levelsCount: row.levelsCount ?? null,
      environmentsNote: row.environmentsNote ?? null,
      startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      designerAgent: row.designerAgent
        ? { id: row.designerAgent.id, fullName: row.designerAgent.fullName }
        : null,
      architectAgent: row.architectAgent
        ? { id: row.architectAgent.id, fullName: row.architectAgent.fullName }
        : null,
      supervisorAgent: row.supervisorAgent
        ? { id: row.supervisorAgent.id, fullName: row.supervisorAgent.fullName }
        : null,
      commercialAgent: row.commercialAgent
        ? { id: row.commercialAgent.id, fullName: row.commercialAgent.fullName }
        : null,
      estimatedBudget: num(row.estimatedBudget),
      projectedCost: num(row.projectedCost),
      expectedMargin: num(row.expectedMargin),
      budgets: (row.budgets ?? []).map((b: any) => ({
        id: b.id,
        code: b.code,
        title: b.title ?? null,
        version: b.version ?? 1,
        totalAmount: num(b.grandTotal) ?? 0,
        status: b.status,
      })),
      materials: (row.materials ?? []).map((m: any) => ({
        id: m.id,
        name: m.name,
        quantity: num(m.quantity),
        unit: m.unit,
        estimatedCost: num(m.estimatedCost),
      })),
      documents: (row.documents ?? []).map((d: any) => ({
        id: d.id,
        docType: d.docType,
        title: d.title,
        fileUrl: d.fileUrl,
      })),
      payments: (row.payments ?? []).map((p: any) => ({
        id: p.id,
        paidAt: p.paidAt.toISOString(),
        amount: num(p.amount) ?? 0,
        concept: p.concept,
        status: p.status,
        scheduleItemId: p.scheduleItemId ?? null,
      })),
      activities: (row.activities ?? []).map((a: any) => ({
        id: a.id,
        activityType: a.activityType,
        title: a.title,
        description: a.description,
        occurredAt: a.occurredAt.toISOString(),
      })),
      milestones: (row.milestones ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        plannedDate: m.plannedDate.toISOString().slice(0, 10),
        completedAt: m.completedAt ? m.completedAt.toISOString().slice(0, 10) : null,
      })),
    };
  }
}
