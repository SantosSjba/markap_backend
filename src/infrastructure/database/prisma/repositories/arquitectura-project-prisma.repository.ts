import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  ArquitecturaProjectDetail,
  ArquitecturaProjectRepository,
  CreateArquitecturaProjectData,
  ListArquitecturaProjectsFilters,
  ListArquitecturaProjectsResult,
  UpdateArquitecturaProjectData,
} from '@domain/repositories/arquitectura-project.repository';
import { ARQUITECTURA_PROJECT_IN_EXECUTION_STATUS_CODES } from '@domain/constants/arquitectura-project-stages.constants';

const IN_EXECUTION_STATUSES = [...ARQUITECTURA_PROJECT_IN_EXECUTION_STATUS_CODES] as const;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class ArquitecturaProjectPrismaRepository implements ArquitecturaProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: ListArquitecturaProjectsFilters): Promise<ListArquitecturaProjectsResult> {
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
      andParts.push({ status: { in: [...IN_EXECUTION_STATUSES] } });
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
      this.prisma.arquitecturaProject.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, documentNumber: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.arquitecturaProject.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        projectType: r.projectType as ArquitecturaProjectDetail['projectType'],
        status: r.status as ArquitecturaProjectDetail['status'],
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

  async findById(id: string, applicationSlug?: string): Promise<ArquitecturaProjectDetail | null> {
    const whereBase: Record<string, unknown> = { id, deletedAt: null };
    if (applicationSlug?.trim()) {
      const app = await this.prisma.application.findUnique({
        where: { slug: applicationSlug.trim() },
      });
      if (!app) return null;
      whereBase.applicationId = app.id;
    }

    const row = await this.prisma.arquitecturaProject.findFirst({
      where: whereBase as never,
      include: {
        client: { select: { id: true, fullName: true, documentNumber: true } },
        designerAgent: { select: { id: true, fullName: true } },
        architectJrAgent: { select: { id: true, fullName: true } },
        architectSrAgent: { select: { id: true, fullName: true } },
        supervisorAgent: { select: { id: true, fullName: true } },
        commercialAgent: { select: { id: true, fullName: true } },
        payments: { orderBy: { paidAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!row) return null;

    return this.mapDetail(row);
  }

  async create(data: CreateArquitecturaProjectData): Promise<ArquitecturaProjectDetail> {
    const row = await this.prisma.arquitecturaProject.create({
      data: {
        applicationId: data.applicationId,
        code: data.code.trim(),
        name: data.name.trim(),
        clientId: data.clientId,
        projectType: data.projectType,
        status: data.status,
        addressLine: data.addressLine?.trim() || null,
        city: data.city?.trim() || null,
        interventionLevel: data.interventionLevel?.trim() || null,
        executionTimeNote: data.executionTimeNote?.trim() || null,
        currency: data.currency?.trim() || 'PEN',
        defaultUtilityPct:
          data.defaultUtilityPct != null ? new Prisma.Decimal(data.defaultUtilityPct) : undefined,
        defaultIgvPct:
          data.defaultIgvPct != null ? new Prisma.Decimal(data.defaultIgvPct) : undefined,
        areaSqm: data.areaSqm ?? null,
        levelsCount: data.levelsCount ?? null,
        environmentsNote: data.environmentsNote?.trim() || null,
        startDate: data.startDate ?? null,
        estimatedEndDate: data.estimatedEndDate ?? null,
        designerAgentId: data.designerAgentId ?? null,
        architectJrAgentId: data.architectJrAgentId ?? null,
        architectSrAgentId: data.architectSrAgentId ?? null,
        supervisorAgentId: data.supervisorAgentId ?? null,
        commercialAgentId: data.commercialAgentId ?? null,
        estimatedBudget: data.estimatedBudget ?? null,
        projectedCost: data.projectedCost ?? null,
        expectedMargin: data.expectedMargin ?? null,
        progressPct: data.progressPct ?? 0,
      },
    });
    const detail = await this.findById(row.id);
    if (!detail) throw new Error('ArquitecturaProject create: detail not found');
    return detail;
  }

  async update(id: string, data: UpdateArquitecturaProjectData): Promise<ArquitecturaProjectDetail> {
    const patch: Prisma.ArquitecturaProjectUncheckedUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.clientId !== undefined) patch.clientId = data.clientId;
    if (data.projectType !== undefined) patch.projectType = data.projectType;
    if (data.status !== undefined) patch.status = data.status;
    if (data.addressLine !== undefined) patch.addressLine = data.addressLine?.trim() || null;
    if (data.city !== undefined) patch.city = data.city?.trim() || null;
    if (data.interventionLevel !== undefined) {
      patch.interventionLevel = data.interventionLevel?.trim() || null;
    }
    if (data.executionTimeNote !== undefined) {
      patch.executionTimeNote = data.executionTimeNote?.trim() || null;
    }
    if (data.currency !== undefined) patch.currency = data.currency?.trim() || 'PEN';
    if (data.defaultUtilityPct !== undefined) {
      patch.defaultUtilityPct =
        data.defaultUtilityPct === null
          ? new Prisma.Decimal(20)
          : new Prisma.Decimal(data.defaultUtilityPct);
    }
    if (data.defaultIgvPct !== undefined) {
      patch.defaultIgvPct =
        data.defaultIgvPct === null
          ? new Prisma.Decimal(18)
          : new Prisma.Decimal(data.defaultIgvPct);
    }
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
    if (data.architectJrAgentId !== undefined) patch.architectJrAgentId = data.architectJrAgentId;
    if (data.architectSrAgentId !== undefined) patch.architectSrAgentId = data.architectSrAgentId;
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

    await this.prisma.arquitecturaProject.update({
      where: { id },
      data: patch,
    });
    const detail = await this.findById(id);
    if (!detail) throw new Error('ArquitecturaProject update: detail not found');
    return detail;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDetail(row: any): ArquitecturaProjectDetail {
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
      city: row.city ?? null,
      interventionLevel: row.interventionLevel ?? null,
      executionTimeNote: row.executionTimeNote ?? null,
      currency: row.currency ?? 'PEN',
      defaultUtilityPct: num(row.defaultUtilityPct) ?? 20,
      defaultIgvPct: num(row.defaultIgvPct) ?? 18,
      areaSqm: num(row.areaSqm),
      levelsCount: row.levelsCount ?? null,
      environmentsNote: row.environmentsNote ?? null,
      startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      designerAgent: row.designerAgent
        ? { id: row.designerAgent.id, fullName: row.designerAgent.fullName }
        : null,
      architectJrAgent: row.architectJrAgent
        ? { id: row.architectJrAgent.id, fullName: row.architectJrAgent.fullName }
        : null,
      architectSrAgent: row.architectSrAgent
        ? { id: row.architectSrAgent.id, fullName: row.architectSrAgent.fullName }
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
      payments: (row.payments ?? []).map((p: { id: string; paidAt: Date; amount: Prisma.Decimal; concept: string; paymentType: string; status: string; scheduleItemId: string | null }) => ({
        id: p.id,
        paidAt: p.paidAt.toISOString(),
        amount: num(p.amount) ?? 0,
        concept: p.concept,
        paymentType: p.paymentType ?? 'OTHER',
        status: p.status,
        scheduleItemId: p.scheduleItemId ?? null,
      })),
      documents: (row.documents ?? []).map((d: { id: string; docType: string; title: string; fileUrl: string | null }) => ({
        id: d.id,
        docType: d.docType,
        title: d.title,
        fileUrl: d.fileUrl,
      })),
    };
  }
}
