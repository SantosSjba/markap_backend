import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateInteriorExecutionActualCostPayload,
  CreateInteriorExecutionEvidencePayload,
  CreateInteriorExecutionIncidentPayload,
  CreateInteriorExecutionTaskPayload,
  InteriorExecutionActualCostDto,
  InteriorExecutionEvidenceDto,
  InteriorExecutionIncidentDto,
  InteriorExecutionMilestoneDto,
  InteriorExecutionOverviewDto,
  InteriorExecutionRepository,
  InteriorExecutionTaskDto,
  UpdateInteriorExecutionIncidentPayload,
  UpdateInteriorExecutionTaskPayload,
} from '@domain/repositories/interior-execution.repository';
import { PrismaService } from '../prisma.service';
import { formatDateOnly } from '@domain/utils/peru-date.util';
import { getProjectBudgetPriceTotal } from '../helpers/project-budget-query.helper';

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateOnly(d: Date | null): string | null {
  if (!d) return null;
  return formatDateOnly(d);
}

const PHASE_RANK: Record<string, number> = {
  DESIGN: 0,
  PURCHASES: 1,
  PRODUCTION: 2,
  INSTALLATION: 3,
};

function rankPhase(p: string): number {
  return PHASE_RANK[p] ?? 99;
}

function mapMilestone(m: {
  id: string;
  title: string;
  plannedDate: Date;
  completedAt: Date | null;
}): InteriorExecutionMilestoneDto {
  return {
    id: m.id,
    title: m.title,
    plannedDate: toDateOnly(m.plannedDate) ?? '',
    completedAt: m.completedAt ? m.completedAt.toISOString() : null,
  };
}

function mapTask(row: {
  id: string;
  projectId: string;
  phase: string;
  title: string;
  description: string | null;
  kanbanStatus: string;
  sortOrder: number;
  plannedStart: Date | null;
  plannedEnd: Date | null;
  progressPct: Prisma.Decimal;
  updatedAt: Date;
}): InteriorExecutionTaskDto {
  return {
    id: row.id,
    projectId: row.projectId,
    phase: row.phase,
    title: row.title,
    description: row.description,
    kanbanStatus: row.kanbanStatus,
    sortOrder: row.sortOrder,
    plannedStart: toDateOnly(row.plannedStart),
    plannedEnd: toDateOnly(row.plannedEnd),
    progressPct: num(row.progressPct),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class InteriorExecutionPrismaRepository implements InteriorExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProjectScope(projectId: string, applicationSlug = 'interiorismo'): Promise<boolean> {
    const slug = applicationSlug.trim() || 'interiorismo';
    const n = await this.prisma.interiorProject.count({
      where: { id: projectId, deletedAt: null, application: { slug } },
    });
    return n > 0;
  }

  async getOverview(projectId: string, applicationSlug = 'interiorismo'): Promise<InteriorExecutionOverviewDto | null> {
    const slug = applicationSlug.trim() || 'interiorismo';
    const project = await this.prisma.interiorProject.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        application: { select: { slug: true } },
        milestones: { orderBy: { plannedDate: 'asc' } },
      },
    });
    if (!project || project.application.slug !== slug) return null;

    const [tasks, evidences, incidents, costs, budgetPriceTotal, sectionCount] = await Promise.all([
      this.prisma.interiorExecutionTask.findMany({ where: { projectId } }),
      this.prisma.interiorExecutionEvidence.findMany({
        where: { projectId },
        orderBy: { capturedAt: 'desc' },
      }),
      this.prisma.interiorExecutionIncident.findMany({
        where: { projectId },
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.interiorExecutionActualCost.findMany({
        where: { projectId },
        orderBy: { occurredAt: 'desc' },
        include: { catalogMaterial: { select: { code: true, name: true } } },
      }),
      getProjectBudgetPriceTotal(this.prisma, projectId),
      this.prisma.interiorProjectSection.count({ where: { projectId } }),
    ]);

    const budgetGrand = sectionCount > 0 ? budgetPriceTotal : null;
    const ref = sectionCount > 0
      ? { id: projectId, code: project.code, version: 1, grandTotal: budgetPriceTotal }
      : null;

    tasks.sort(
      (a, b) =>
        rankPhase(a.phase) - rankPhase(b.phase) ||
        a.sortOrder - b.sortOrder ||
        a.title.localeCompare(b.title),
    );

    const labor = costs.filter((c) => c.costCategory === 'LABOR').reduce((s, c) => s + num(c.amount), 0);
    const material = costs.filter((c) => c.costCategory === 'MATERIAL').reduce((s, c) => s + num(c.amount), 0);
    const expense = costs.filter((c) => c.costCategory === 'EXPENSE').reduce((s, c) => s + num(c.amount), 0);
    const transport = costs.filter((c) => c.costCategory === 'TRANSPORT').reduce((s, c) => s + num(c.amount), 0);
    const totalActual = labor + material + expense + transport;

    const mappedCosts: InteriorExecutionActualCostDto[] = costs.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      costCategory: c.costCategory,
      concept: c.concept,
      amount: num(c.amount),
      occurredAt: toDateOnly(c.occurredAt) ?? '',
      catalogMaterialId: c.catalogMaterialId,
      materialCode: c.catalogMaterial?.code ?? null,
      materialName: c.catalogMaterial?.name ?? null,
    }));

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      progressPct: num(project.progressPct),
      milestones: project.milestones.map(mapMilestone),
      tasks: tasks.map(mapTask),
      evidences: evidences.map(
        (e): InteriorExecutionEvidenceDto => ({
          id: e.id,
          projectId: e.projectId,
          taskId: e.taskId,
          kind: e.kind,
          title: e.title,
          fileUrl: e.fileUrl,
          archivoId: e.archivoId,
          capturedAt: e.capturedAt.toISOString(),
        }),
      ),
      incidents: incidents.map(
        (i): InteriorExecutionIncidentDto => ({
          id: i.id,
          projectId: i.projectId,
          severity: i.severity,
          title: i.title,
          description: i.description,
          status: i.status,
          reportedAt: i.reportedAt.toISOString(),
          closedAt: i.closedAt ? i.closedAt.toISOString() : null,
          updatedAt: i.updatedAt.toISOString(),
        }),
      ),
      actualCosts: mappedCosts,
      costTotals: { labor, material, expense, transport, total: totalActual },
      budgetReference: {
        budgetId: ref?.id ?? null,
        code: ref?.code ?? null,
        version: ref?.version ?? null,
        grandTotal: budgetGrand,
      },
      varianceVsBudget: budgetGrand != null ? totalActual - budgetGrand : null,
    };
  }

  async createTask(projectId: string, payload: CreateInteriorExecutionTaskPayload): Promise<InteriorExecutionTaskDto> {
    const agg = await this.prisma.interiorExecutionTask.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    const sortOrder = (agg._max.sortOrder ?? -1) + 1;
    const row = await this.prisma.interiorExecutionTask.create({
      data: {
        projectId,
        phase: payload.phase,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        kanbanStatus: payload.kanbanStatus ?? 'BACKLOG',
        sortOrder,
        plannedStart: payload.plannedStart ?? null,
        plannedEnd: payload.plannedEnd ?? null,
        progressPct:
          payload.progressPct != null ? new Prisma.Decimal(payload.progressPct) : new Prisma.Decimal(0),
      },
    });
    return mapTask(row);
  }

  async updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateInteriorExecutionTaskPayload,
  ): Promise<InteriorExecutionTaskDto | null> {
    const existing = await this.prisma.interiorExecutionTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!existing) return null;

    const patch: Prisma.InteriorExecutionTaskUncheckedUpdateInput = {};
    if (payload.phase != null) patch.phase = payload.phase;
    if (payload.title != null) patch.title = payload.title.trim();
    if (payload.description !== undefined) patch.description = payload.description?.trim() ?? null;
    if (payload.kanbanStatus != null) patch.kanbanStatus = payload.kanbanStatus;
    if (payload.sortOrder != null) patch.sortOrder = payload.sortOrder;
    if (payload.plannedStart !== undefined) patch.plannedStart = payload.plannedStart;
    if (payload.plannedEnd !== undefined) patch.plannedEnd = payload.plannedEnd;
    if (payload.progressPct != null) patch.progressPct = new Prisma.Decimal(payload.progressPct);

    const row = await this.prisma.interiorExecutionTask.update({
      where: { id: taskId },
      data: patch,
    });
    return mapTask(row);
  }

  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    const r = await this.prisma.interiorExecutionTask.deleteMany({ where: { id: taskId, projectId } });
    return r.count > 0;
  }

  async createEvidence(
    projectId: string,
    payload: CreateInteriorExecutionEvidencePayload,
  ): Promise<InteriorExecutionEvidenceDto> {
    const tid = payload.taskId?.trim() || null;
    if (tid) {
      const ok = await this.prisma.interiorExecutionTask.count({ where: { id: tid, projectId } });
      if (!ok) {
        throw new Error('TASK_SCOPE');
      }
    }
    const row = await this.prisma.interiorExecutionEvidence.create({
      data: {
        projectId,
        taskId: tid,
        kind: payload.kind,
        title: payload.title.trim(),
        fileUrl: payload.fileUrl.trim(),
        archivoId: payload.archivoId?.trim() || null,
        capturedAt: payload.capturedAt,
      },
    });
    return {
      id: row.id,
      projectId: row.projectId,
      taskId: row.taskId,
      kind: row.kind,
      title: row.title,
      fileUrl: row.fileUrl,
      archivoId: row.archivoId,
      capturedAt: row.capturedAt.toISOString(),
    };
  }

  async deleteEvidence(projectId: string, evidenceId: string): Promise<boolean> {
    const r = await this.prisma.interiorExecutionEvidence.deleteMany({
      where: { id: evidenceId, projectId },
    });
    return r.count > 0;
  }

  async createIncident(
    projectId: string,
    payload: CreateInteriorExecutionIncidentPayload,
  ): Promise<InteriorExecutionIncidentDto> {
    const row = await this.prisma.interiorExecutionIncident.create({
      data: {
        projectId,
        severity: payload.severity,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        reportedAt: payload.reportedAt,
      },
    });
    return {
      id: row.id,
      projectId: row.projectId,
      severity: row.severity,
      title: row.title,
      description: row.description,
      status: row.status,
      reportedAt: row.reportedAt.toISOString(),
      closedAt: row.closedAt ? row.closedAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateIncident(
    projectId: string,
    incidentId: string,
    payload: UpdateInteriorExecutionIncidentPayload,
  ): Promise<InteriorExecutionIncidentDto | null> {
    const existing = await this.prisma.interiorExecutionIncident.findFirst({
      where: { id: incidentId, projectId },
    });
    if (!existing) return null;

    const patch: Prisma.InteriorExecutionIncidentUncheckedUpdateInput = {};
    if (payload.status != null) patch.status = payload.status;
    if (payload.title != null) patch.title = payload.title.trim();
    if (payload.description !== undefined) patch.description = payload.description?.trim() ?? null;
    if (payload.severity != null) patch.severity = payload.severity;
    if (payload.closedAt !== undefined) patch.closedAt = payload.closedAt;

    const row = await this.prisma.interiorExecutionIncident.update({
      where: { id: incidentId },
      data: patch,
    });
    return {
      id: row.id,
      projectId: row.projectId,
      severity: row.severity,
      title: row.title,
      description: row.description,
      status: row.status,
      reportedAt: row.reportedAt.toISOString(),
      closedAt: row.closedAt ? row.closedAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createActualCost(
    projectId: string,
    payload: CreateInteriorExecutionActualCostPayload,
  ): Promise<InteriorExecutionActualCostDto> {
    const mid = payload.catalogMaterialId?.trim() || null;
    const row = await this.prisma.interiorExecutionActualCost.create({
      data: {
        projectId,
        costCategory: payload.costCategory,
        concept: payload.concept.trim(),
        amount: new Prisma.Decimal(payload.amount),
        occurredAt: payload.occurredAt,
        catalogMaterialId: mid,
      },
      include: { catalogMaterial: { select: { code: true, name: true } } },
    });
    return {
      id: row.id,
      projectId: row.projectId,
      costCategory: row.costCategory,
      concept: row.concept,
      amount: num(row.amount),
      occurredAt: toDateOnly(row.occurredAt) ?? '',
      catalogMaterialId: row.catalogMaterialId,
      materialCode: row.catalogMaterial?.code ?? null,
      materialName: row.catalogMaterial?.name ?? null,
    };
  }

  async deleteActualCost(projectId: string, costId: string): Promise<boolean> {
    const r = await this.prisma.interiorExecutionActualCost.deleteMany({
      where: { id: costId, projectId },
    });
    return r.count > 0;
  }
}
