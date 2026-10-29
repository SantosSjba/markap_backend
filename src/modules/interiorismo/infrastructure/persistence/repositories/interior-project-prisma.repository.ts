import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type {
  CreateInteriorProjectActivityData,
  CreateInteriorProjectData,
  InteriorProjectDetail,
  InteriorClientPaymentDto,
  InteriorClientProjectsSummary,
  InteriorProjectDistrictRef,
  InteriorProjectRepository,
  InteriorProjectStatsRow,
  ListInteriorProjectsFilters,
  ListInteriorProjectsResult,
  UpdateInteriorProjectData,
} from '../../../domain/repositories/interior-project.repository';

import { formatDateOnly } from '../../../../../shared/domain/utils/peru-date.util';
import { INTERIOR_PROJECT_ACTIVE_STATUS_CODES } from '../../../domain/constants/interior-project-stages.constants';

const IN_PROGRESS_STATUSES = [...INTERIOR_PROJECT_ACTIVE_STATUS_CODES] as const;

const DISTRICT_INCLUDE = {
  select: {
    id: true,
    name: true,
    provinceId: true,
    province: { select: { departmentId: true } },
  },
} as const;

type DistrictRow = {
  id: string;
  name: string;
  provinceId: string;
  province: { departmentId: string };
} | null;

function mapDistrict(d: DistrictRow): InteriorProjectDistrictRef | null {
  return d
    ? {
        id: d.id,
        name: d.name,
        provinceId: d.provinceId,
        departmentId: d.province.departmentId,
      }
    : null;
}

/** Cobrado en la moneda del proyecto (los cobros en otra moneda se ven en la liquidación) */
function sumPaid(
  payments: { amount: unknown; status: string; currency: string | null }[],
  currency: string,
): number {
  return payments
    .filter(
      (p) => p.status === 'PAID' && (!p.currency || p.currency === currency),
    )
    .reduce((acc, p) => acc + (num(p.amount) ?? 0), 0);
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class InteriorProjectPrismaRepository implements InteriorProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filters: ListInteriorProjectsFilters,
  ): Promise<ListInteriorProjectsResult> {
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
    if (filters.projectType) {
      andParts.push({ projectType: filters.projectType });
    }
    if (filters.agentId?.trim()) {
      const agentId = filters.agentId.trim();
      andParts.push({
        OR: [
          { designerAgentId: agentId },
          { architectJrAgentId: agentId },
          { architectSrAgentId: agentId },
          { supervisorAgentId: agentId },
          { commercialAgentId: agentId },
        ],
      });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { legacyCode: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { client: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorProject.findMany({
        where,
        include: {
          client: {
            select: { id: true, fullName: true, documentNumber: true },
          },
          district: DISTRICT_INCLUDE,
          payments: { select: { amount: true, status: true, currency: true } },
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
        interventionLevel: r.interventionLevel ?? null,
        currency: r.currency ?? 'PEN',
        estimatedBudget: num(r.estimatedBudget),
        paidTotal: sumPaid(r.payments, r.currency ?? 'PEN'),
        startDate: r.startDate ? formatDateOnly(r.startDate) : null,
        estimatedEndDate: r.estimatedEndDate
          ? formatDateOnly(r.estimatedEndDate)
          : null,
        district: mapDistrict(r.district),
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

  async findById(
    id: string,
    applicationSlug?: string,
  ): Promise<InteriorProjectDetail | null> {
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
        architectJrAgent: { select: { id: true, fullName: true } },
        architectSrAgent: { select: { id: true, fullName: true } },
        supervisorAgent: { select: { id: true, fullName: true } },
        commercialAgent: { select: { id: true, fullName: true } },
        district: DISTRICT_INCLUDE,
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

  async create(
    data: CreateInteriorProjectData,
  ): Promise<InteriorProjectDetail> {
    const row = await this.prisma.interiorProject.create({
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
          data.defaultUtilityPct != null
            ? new Prisma.Decimal(data.defaultUtilityPct)
            : undefined,
        defaultIgvPct:
          data.defaultIgvPct != null
            ? new Prisma.Decimal(data.defaultIgvPct)
            : undefined,
        defaultOverheadPct:
          data.defaultOverheadPct != null
            ? new Prisma.Decimal(data.defaultOverheadPct)
            : undefined,
        exchangeRate:
          data.exchangeRate != null
            ? new Prisma.Decimal(data.exchangeRate)
            : null,
        districtId: data.districtId || null,
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
    if (!detail) throw new Error('No se pudo cargar el proyecto creado.');
    return detail;
  }

  async createActivity(
    projectId: string,
    data: CreateInteriorProjectActivityData,
  ): Promise<void> {
    await this.prisma.interiorProjectActivity.create({
      data: {
        projectId,
        activityType: data.activityType,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        occurredAt: data.occurredAt,
      },
    });
  }

  async deleteManualActivity(
    projectId: string,
    activityId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.interiorProjectActivity.deleteMany({
      where: {
        id: activityId,
        projectId,
        activityType: { not: 'STATUS_CHANGE' },
      },
    });
    return count > 0;
  }

  async update(
    id: string,
    data: UpdateInteriorProjectData,
  ): Promise<InteriorProjectDetail> {
    const patch: Prisma.InteriorProjectUncheckedUpdateInput = {};
    if (data.code !== undefined) patch.code = data.code.trim();
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.clientId !== undefined) patch.clientId = data.clientId;
    if (data.projectType !== undefined) patch.projectType = data.projectType;
    if (data.status !== undefined) patch.status = data.status;
    if (data.addressLine !== undefined)
      patch.addressLine = data.addressLine?.trim() || null;
    if (data.city !== undefined) patch.city = data.city?.trim() || null;
    if (data.interventionLevel !== undefined) {
      patch.interventionLevel = data.interventionLevel?.trim() || null;
    }
    if (data.executionTimeNote !== undefined) {
      patch.executionTimeNote = data.executionTimeNote?.trim() || null;
    }
    if (data.currency !== undefined)
      patch.currency = data.currency?.trim() || 'PEN';
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
    if (data.defaultOverheadPct !== undefined) {
      patch.defaultOverheadPct = new Prisma.Decimal(
        data.defaultOverheadPct ?? 0,
      );
    }
    if (data.exchangeRate !== undefined) {
      patch.exchangeRate =
        data.exchangeRate === null
          ? null
          : new Prisma.Decimal(data.exchangeRate);
    }
    if (data.districtId !== undefined)
      patch.districtId = data.districtId || null;
    if (data.areaSqm !== undefined) {
      patch.areaSqm =
        data.areaSqm === null ? null : new Prisma.Decimal(data.areaSqm);
    }
    if (data.levelsCount !== undefined) patch.levelsCount = data.levelsCount;
    if (data.environmentsNote !== undefined) {
      patch.environmentsNote = data.environmentsNote?.trim() || null;
    }
    if (data.startDate !== undefined) patch.startDate = data.startDate;
    if (data.estimatedEndDate !== undefined)
      patch.estimatedEndDate = data.estimatedEndDate;
    if (data.designerAgentId !== undefined)
      patch.designerAgentId = data.designerAgentId;
    if (data.architectJrAgentId !== undefined)
      patch.architectJrAgentId = data.architectJrAgentId;
    if (data.architectSrAgentId !== undefined)
      patch.architectSrAgentId = data.architectSrAgentId;
    if (data.supervisorAgentId !== undefined)
      patch.supervisorAgentId = data.supervisorAgentId;
    if (data.commercialAgentId !== undefined)
      patch.commercialAgentId = data.commercialAgentId;
    if (data.estimatedBudget !== undefined) {
      patch.estimatedBudget =
        data.estimatedBudget === null
          ? null
          : new Prisma.Decimal(data.estimatedBudget);
    }
    if (data.projectedCost !== undefined) {
      patch.projectedCost =
        data.projectedCost === null
          ? null
          : new Prisma.Decimal(data.projectedCost);
    }
    if (data.expectedMargin !== undefined) {
      patch.expectedMargin =
        data.expectedMargin === null
          ? null
          : new Prisma.Decimal(data.expectedMargin);
    }
    if (data.progressPct !== undefined && data.progressPct !== null) {
      patch.progressPct = new Prisma.Decimal(data.progressPct);
    }

    await this.prisma.interiorProject.update({
      where: { id },
      data: patch,
    });
    const detail = await this.findById(id);
    if (!detail) throw new Error('Proyecto no encontrado.');
    return detail;
  }

  async listCodesWithPrefix(
    applicationId: string,
    prefix: string,
  ): Promise<string[]> {
    const rows = await this.prisma.interiorProject.findMany({
      where: { applicationId, code: { startsWith: prefix } },
      select: { code: true },
    });
    return rows.map((r) => r.code);
  }

  async summarizeByClients(
    applicationSlug: string,
    clientIds: string[],
  ): Promise<InteriorClientProjectsSummary[]> {
    if (!clientIds.length) return [];
    const rows = await this.prisma.interiorProject.findMany({
      where: {
        application: { slug: applicationSlug },
        deletedAt: null,
        clientId: { in: clientIds },
      },
      select: { clientId: true, status: true },
    });
    const active = new Set<string>(IN_PROGRESS_STATUSES);
    return clientIds.map((clientId) => {
      const own = rows.filter((r) => r.clientId === clientId);
      return {
        clientId,
        total: own.length,
        active: own.filter((r) => active.has(r.status)).length,
      };
    });
  }

  async findClientPayments(
    applicationSlug: string,
    clientId: string,
  ): Promise<InteriorClientPaymentDto[]> {
    const rows = await this.prisma.interiorProjectPayment.findMany({
      where: {
        project: {
          clientId,
          deletedAt: null,
          application: { slug: applicationSlug },
        },
      },
      orderBy: { paidAt: 'desc' },
      include: {
        project: {
          select: { id: true, code: true, name: true, currency: true },
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      paidAt: p.paidAt.toISOString(),
      amount: num(p.amount) ?? 0,
      currency: p.currency ?? p.project.currency ?? 'PEN',
      concept: p.concept,
      paymentType: p.paymentType ?? 'OTHER',
      status: p.status,
      project: { id: p.project.id, code: p.project.code, name: p.project.name },
    }));
  }

  async findStatsRows(
    applicationSlug: string,
  ): Promise<InteriorProjectStatsRow[]> {
    const rows = await this.prisma.interiorProject.findMany({
      where: { application: { slug: applicationSlug }, deletedAt: null },
      select: {
        status: true,
        currency: true,
        estimatedBudget: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      status: r.status,
      currency: r.currency ?? 'PEN',
      estimatedBudget: num(r.estimatedBudget),
      createdAt: r.createdAt,
    }));
  }

  private mapDetail(
    row: Prisma.InteriorProjectGetPayload<{
      include: {
        client: { select: { id: true; fullName: true; documentNumber: true } };
        designerAgent: { select: { id: true; fullName: true } };
        architectJrAgent: { select: { id: true; fullName: true } };
        architectSrAgent: { select: { id: true; fullName: true } };
        supervisorAgent: { select: { id: true; fullName: true } };
        commercialAgent: { select: { id: true; fullName: true } };
        district: typeof DISTRICT_INCLUDE;
        materials: true;
        documents: true;
        payments: true;
        activities: true;
        milestones: true;
      };
    }>,
  ): InteriorProjectDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      projectType: row.projectType as InteriorProjectDetail['projectType'],
      status: row.status as InteriorProjectDetail['status'],
      progressPct: num(row.progressPct) ?? 0,
      interventionLevel: row.interventionLevel ?? null,
      currency: row.currency ?? 'PEN',
      estimatedBudget: num(row.estimatedBudget),
      paidTotal: sumPaid(row.payments ?? [], row.currency ?? 'PEN'),
      startDate: row.startDate ? formatDateOnly(row.startDate) : null,
      estimatedEndDate: row.estimatedEndDate
        ? formatDateOnly(row.estimatedEndDate)
        : null,
      district: mapDistrict(row.district),
      client: {
        id: row.client.id,
        fullName: row.client.fullName,
        documentNumber: row.client.documentNumber,
      },
      legacyCode: row.legacyCode ?? null,
      addressLine: row.addressLine ?? null,
      city: row.city ?? null,
      executionTimeNote: row.executionTimeNote ?? null,
      exchangeRate: num(row.exchangeRate),
      defaultUtilityPct: num(row.defaultUtilityPct) ?? 20,
      defaultOverheadPct: num(row.defaultOverheadPct) ?? 0,
      defaultIgvPct: num(row.defaultIgvPct) ?? 18,
      areaSqm: num(row.areaSqm),
      levelsCount: row.levelsCount ?? null,
      environmentsNote: row.environmentsNote ?? null,
      designerAgent: row.designerAgent
        ? { id: row.designerAgent.id, fullName: row.designerAgent.fullName }
        : null,
      architectJrAgent: row.architectJrAgent
        ? {
            id: row.architectJrAgent.id,
            fullName: row.architectJrAgent.fullName,
          }
        : null,
      architectSrAgent: row.architectSrAgent
        ? {
            id: row.architectSrAgent.id,
            fullName: row.architectSrAgent.fullName,
          }
        : null,
      supervisorAgent: row.supervisorAgent
        ? { id: row.supervisorAgent.id, fullName: row.supervisorAgent.fullName }
        : null,
      commercialAgent: row.commercialAgent
        ? { id: row.commercialAgent.id, fullName: row.commercialAgent.fullName }
        : null,
      projectedCost: num(row.projectedCost),
      expectedMargin: num(row.expectedMargin),
      materials: (row.materials ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        quantity: num(m.quantity),
        unit: m.unit,
        estimatedCost: num(m.estimatedCost),
      })),
      documents: (row.documents ?? []).map((d) => ({
        id: d.id,
        docType: d.docType,
        title: d.title,
        fileUrl: d.fileUrl,
        archivoId: d.archivoId ?? null,
      })),
      payments: (row.payments ?? []).map((p) => ({
        id: p.id,
        paidAt: p.paidAt.toISOString(),
        amount: num(p.amount) ?? 0,
        concept: p.concept,
        paymentType: p.paymentType ?? 'OTHER',
        status: p.status,
        scheduleItemId: p.scheduleItemId ?? null,
        currency: p.currency ?? null,
        exchangeRate: p.exchangeRate != null ? Number(p.exchangeRate) : null,
      })),
      activities: (row.activities ?? []).map((a) => ({
        id: a.id,
        activityType: a.activityType,
        title: a.title,
        description: a.description,
        occurredAt: a.occurredAt.toISOString(),
      })),
      milestones: (row.milestones ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        plannedDate: formatDateOnly(m.plannedDate),
        completedAt: m.completedAt ? formatDateOnly(m.completedAt) : null,
      })),
    };
  }
}
