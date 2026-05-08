import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateInteriorCalendarEventPayload,
  InteriorCalendarFeedFilters,
  InteriorCalendarFeedItemDto,
  InteriorCalendarRepository,
  UpdateInteriorCalendarEventPayload,
} from '@domain/repositories/interior-calendar.repository';
import { PrismaService } from '../prisma.service';

function startOfDayUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfDayUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

function iso(d: Date): string {
  return d.toISOString();
}

function dateAtNoonUtc(ymd: Date): Date {
  const s = ymd.toISOString().slice(0, 10);
  return new Date(`${s}T12:00:00.000Z`);
}

function mapManual(row: {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  projectId: string | null;
  project: { code: string; name: string } | null;
  assignedAgent: { id: string; fullName: string } | null;
}): InteriorCalendarFeedItemDto {
  return {
    id: row.id,
    source: 'MANUAL',
    eventType: row.eventType,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: iso(row.startsAt),
    endsAt: row.endsAt ? iso(row.endsAt) : null,
    allDay: row.allDay,
    projectId: row.projectId,
    projectCode: row.project?.code ?? null,
    projectName: row.project?.name ?? null,
    assignedAgentId: row.assignedAgent?.id ?? null,
    assignedAgentName: row.assignedAgent?.fullName ?? null,
    readOnly: false,
    executionPhase: null,
  };
}

@Injectable()
export class InteriorCalendarPrismaRepository implements InteriorCalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveApplicationId(slug: string): Promise<string | null> {
    const app = await this.prisma.application.findFirst({
      where: { slug: slug.trim(), deletedAt: null },
      select: { id: true },
    });
    return app?.id ?? null;
  }

  async ensureManualEventScope(eventId: string, applicationSlug: string): Promise<boolean> {
    const app = await this.prisma.application.findFirst({
      where: { slug: applicationSlug.trim(), deletedAt: null },
      select: { id: true },
    });
    if (!app) return false;
    const n = await this.prisma.interiorCalendarEvent.count({
      where: { id: eventId, applicationId: app.id },
    });
    return n > 0;
  }

  async getFeed(filters: InteriorCalendarFeedFilters): Promise<InteriorCalendarFeedItemDto[]> {
    const slug = filters.applicationSlug.trim() || 'interiorismo';
    const app = await this.prisma.application.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return [];

    const from = startOfDayUtc(filters.from);
    const to = endOfDayUtc(filters.to);

    const projectWhere: Prisma.InteriorProjectWhereInput = {
      applicationId: app.id,
      deletedAt: null,
      ...(filters.projectId?.trim() ? { id: filters.projectId.trim() } : {}),
    };

    const projectIdsRow = await this.prisma.interiorProject.findMany({
      where: projectWhere,
      select: { id: true, code: true, name: true },
    });
    const projectIds = projectIdsRow.map((p) => p.id);
    const projMap = new Map(projectIdsRow.map((p) => [p.id, p]));

    const manualWhere: Prisma.InteriorCalendarEventWhereInput = {
      applicationId: app.id,
      startsAt: { gte: from, lte: to },
      ...(filters.projectId?.trim() ? { projectId: filters.projectId.trim() } : {}),
      ...(filters.agentId?.trim() ? { assignedAgentId: filters.agentId.trim() } : {}),
    };

    const [manualRows, milestones, tasks, financeRows] = await Promise.all([
      this.prisma.interiorCalendarEvent.findMany({
        where: manualWhere,
        include: {
          project: { select: { code: true, name: true } },
          assignedAgent: { select: { id: true, fullName: true } },
        },
        orderBy: { startsAt: 'asc' },
      }),
      projectIds.length === 0
        ? []
        : this.prisma.interiorProjectMilestone.findMany({
            where: {
              projectId: { in: projectIds },
              plannedDate: { gte: from, lte: to },
            },
          }),
      projectIds.length === 0
        ? []
        : this.prisma.interiorExecutionTask.findMany({
            where: {
              projectId: { in: projectIds },
              OR: [{ plannedStart: { not: null } }, { plannedEnd: { not: null } }],
            },
          }),
      projectIds.length === 0
        ? []
        : this.prisma.interiorFinanceIncomeSchedule.findMany({
            where: {
              projectId: { in: projectIds },
              dueDate: { gte: from, lte: to },
              status: { in: ['PENDING', 'PARTIAL'] },
            },
          }),
    ]);

    const out: InteriorCalendarFeedItemDto[] = [];

    for (const row of manualRows) {
      out.push(
        mapManual({
          ...row,
          project: row.project,
          assignedAgent: row.assignedAgent,
        }),
      );
    }

    for (const ms of milestones) {
      const p = projMap.get(ms.projectId);
      out.push({
        id: `ml:${ms.id}`,
        source: 'MILESTONE',
        eventType: 'MILESTONE',
        title: `Hito: ${ms.title}`,
        description: ms.completedAt ? 'Completado' : null,
        location: null,
        startsAt: iso(dateAtNoonUtc(ms.plannedDate)),
        endsAt: null,
        allDay: true,
        projectId: ms.projectId,
        projectCode: p?.code ?? null,
        projectName: p?.name ?? null,
        assignedAgentId: null,
        assignedAgentName: null,
        readOnly: true,
        executionPhase: null,
      });
    }

    for (const t of tasks) {
      const p = projMap.get(t.projectId);
      const ps = t.plannedStart;
      const pe = t.plannedEnd ?? t.plannedStart;
      if (!ps && !pe) continue;
      const start = ps ? dateAtNoonUtc(ps) : dateAtNoonUtc(pe!);
      const end = pe ? dateAtNoonUtc(pe) : start;
      const taskType =
        t.phase === 'INSTALLATION'
          ? 'TASK_INSTALLATION'
          : t.phase === 'DESIGN'
            ? 'TASK_DESIGN'
            : t.phase === 'PURCHASES'
              ? 'TASK_PURCHASES'
              : t.phase === 'PRODUCTION'
                ? 'TASK_PRODUCTION'
                : 'TASK_OTHER';

      const overlaps = start.getTime() <= to.getTime() && end.getTime() >= from.getTime();
      if (!overlaps) continue;

      out.push({
        id: `tk:${t.id}`,
        source: 'EXECUTION_TASK',
        eventType: taskType,
        title: t.title,
        description: t.description,
        location: null,
        startsAt: iso(start),
        endsAt: iso(end),
        allDay: true,
        projectId: t.projectId,
        projectCode: p?.code ?? null,
        projectName: p?.name ?? null,
        assignedAgentId: null,
        assignedAgentName: null,
        readOnly: true,
        executionPhase: t.phase,
      });
    }

    for (const f of financeRows) {
      const p = projMap.get(f.projectId);
      out.push({
        id: `fn:${f.id}`,
        source: 'FINANCE_SCHEDULE',
        eventType: 'FINANCE_DUE',
        title: `Cobro: ${f.concept}`,
        description: `Estado ${f.status}`,
        location: null,
        startsAt: iso(dateAtNoonUtc(f.dueDate)),
        endsAt: null,
        allDay: true,
        projectId: f.projectId,
        projectCode: p?.code ?? null,
        projectName: p?.name ?? null,
        assignedAgentId: null,
        assignedAgentName: null,
        readOnly: true,
        executionPhase: null,
      });
    }

    out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return out;
  }

  async createEvent(payload: CreateInteriorCalendarEventPayload): Promise<InteriorCalendarFeedItemDto> {
    const row = await this.prisma.interiorCalendarEvent.create({
      data: {
        applicationId: payload.applicationId,
        projectId: payload.projectId?.trim() || null,
        eventType: payload.eventType.trim(),
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        location: payload.location?.trim() || null,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt ?? null,
        allDay: payload.allDay ?? false,
        assignedAgentId: payload.assignedAgentId?.trim() || null,
      },
      include: {
        project: { select: { code: true, name: true } },
        assignedAgent: { select: { id: true, fullName: true } },
      },
    });
    return mapManual({
      ...row,
      project: row.project,
      assignedAgent: row.assignedAgent,
    });
  }

  async updateEvent(
    eventId: string,
    applicationSlug: string,
    payload: UpdateInteriorCalendarEventPayload,
  ): Promise<InteriorCalendarFeedItemDto> {
    const ok = await this.ensureManualEventScope(eventId, applicationSlug);
    if (!ok) throw new Error('EVENT_NOT_FOUND');

    const patch: Prisma.InteriorCalendarEventUpdateInput = {};
    if (payload.projectId !== undefined) {
      patch.project = payload.projectId?.trim()
        ? { connect: { id: payload.projectId.trim() } }
        : { disconnect: true };
    }
    if (payload.eventType !== undefined) patch.eventType = payload.eventType.trim();
    if (payload.title !== undefined) patch.title = payload.title.trim();
    if (payload.description !== undefined) patch.description = payload.description?.trim() || null;
    if (payload.location !== undefined) patch.location = payload.location?.trim() || null;
    if (payload.startsAt !== undefined) patch.startsAt = payload.startsAt;
    if (payload.endsAt !== undefined) patch.endsAt = payload.endsAt ?? null;
    if (payload.allDay !== undefined) patch.allDay = payload.allDay;
    if (payload.assignedAgentId !== undefined) {
      patch.assignedAgent = payload.assignedAgentId?.trim()
        ? { connect: { id: payload.assignedAgentId.trim() } }
        : { disconnect: true };
    }

    const row = await this.prisma.interiorCalendarEvent.update({
      where: { id: eventId },
      data: patch,
      include: {
        project: { select: { code: true, name: true } },
        assignedAgent: { select: { id: true, fullName: true } },
      },
    });
    return mapManual({
      ...row,
      project: row.project,
      assignedAgent: row.assignedAgent,
    });
  }

  async deleteEvent(eventId: string, applicationSlug: string): Promise<void> {
    const ok = await this.ensureManualEventScope(eventId, applicationSlug);
    if (!ok) throw new Error('EVENT_NOT_FOUND');
    await this.prisma.interiorCalendarEvent.delete({ where: { id: eventId } });
  }
}
