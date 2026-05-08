import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INTERIOR_CALENDAR_REPOSITORY,
  type CreateInteriorCalendarEventPayload,
  type InteriorCalendarFeedFilters,
  type InteriorCalendarRepository,
  type UpdateInteriorCalendarEventPayload,
} from '@domain/repositories/interior-calendar.repository';

export type CreateInteriorCalendarEventInput = Omit<CreateInteriorCalendarEventPayload, 'applicationId'>;
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

const SLUG_DFLT = 'interiorismo';

const MANUAL_TYPES = ['MEETING', 'VISIT', 'INSTALLATION', 'DEADLINE', 'TEAM_BLOCK'] as const;

function assertManualType(v: string) {
  if (!(MANUAL_TYPES as readonly string[]).includes(v)) {
    throw new BadRequestException(`Tipo de evento inválido. Use: ${MANUAL_TYPES.join(', ')}`);
  }
}

function parseRange(from?: string, to?: string): { from: Date; to: Date } {
  if (!from?.trim() || !to?.trim()) throw new BadRequestException('Parámetros from y to son requeridos (ISO date)');
  const a = new Date(from.trim());
  const b = new Date(to.trim());
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    throw new BadRequestException('Fechas from/to inválidas');
  }
  if (b.getTime() < a.getTime()) throw new BadRequestException('La fecha to debe ser >= from');
  return { from: a, to: b };
}

function mapRepoErr(e: unknown): never {
  const msg = e instanceof Error ? e.message : '';
  if (msg === 'EVENT_NOT_FOUND') throw new NotFoundException('Evento no encontrado');
  throw e instanceof Error ? e : new BadRequestException('Error en calendario');
}

@Injectable()
export class GetInteriorCalendarFeedUseCase {
  constructor(
    @Inject(INTERIOR_CALENDAR_REPOSITORY)
    private readonly repo: InteriorCalendarRepository,
  ) {}

  execute(filters: InteriorCalendarFeedFilters) {
    return this.repo.getFeed(filters);
  }
}

@Injectable()
export class CreateInteriorCalendarEventUseCase {
  constructor(
    @Inject(INTERIOR_CALENDAR_REPOSITORY)
    private readonly repo: InteriorCalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(applicationSlug: string | undefined, payload: CreateInteriorCalendarEventInput) {
    assertManualType(payload.eventType);
    const slug = applicationSlug?.trim() || SLUG_DFLT;
    const applicationId = await this.repo.resolveApplicationId(slug);
    if (!applicationId) throw new NotFoundException('Aplicación no encontrada');

    const pid = payload.projectId?.trim() || null;
    if (pid) {
      const ok = await this.prisma.interiorProject.count({
        where: { id: pid, applicationId, deletedAt: null },
      });
      if (!ok) throw new BadRequestException('El proyecto no pertenece a interiorismo');
    }

    if (payload.assignedAgentId?.trim()) {
      const aid = payload.assignedAgentId.trim();
      const agentOk = await this.prisma.agent.count({
        where: { id: aid, applicationId, deletedAt: null },
      });
      if (!agentOk) throw new BadRequestException('Agente no válido para esta aplicación');
    }

    return this.repo.createEvent({
      ...payload,
      applicationId,
      projectId: pid,
      assignedAgentId: payload.assignedAgentId?.trim() || null,
    });
  }
}

@Injectable()
export class UpdateInteriorCalendarEventUseCase {
  constructor(
    @Inject(INTERIOR_CALENDAR_REPOSITORY)
    private readonly repo: InteriorCalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    eventId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorCalendarEventPayload,
  ) {
    if (payload.eventType !== undefined) assertManualType(payload.eventType);
    const slug = applicationSlug?.trim() || SLUG_DFLT;
    const applicationId = await this.repo.resolveApplicationId(slug);
    if (!applicationId) throw new NotFoundException('Aplicación no encontrada');

    if (payload.projectId !== undefined && payload.projectId?.trim()) {
      const pid = payload.projectId.trim();
      const ok = await this.prisma.interiorProject.count({
        where: { id: pid, applicationId, deletedAt: null },
      });
      if (!ok) throw new BadRequestException('El proyecto no pertenece a interiorismo');
    }

    if (payload.assignedAgentId !== undefined && payload.assignedAgentId?.trim()) {
      const aid = payload.assignedAgentId.trim();
      const agentOk = await this.prisma.agent.count({
        where: { id: aid, applicationId, deletedAt: null },
      });
      if (!agentOk) throw new BadRequestException('Agente no válido para esta aplicación');
    }

    try {
      return await this.repo.updateEvent(eventId, slug, payload);
    } catch (e) {
      mapRepoErr(e);
    }
  }
}

@Injectable()
export class DeleteInteriorCalendarEventUseCase {
  constructor(
    @Inject(INTERIOR_CALENDAR_REPOSITORY)
    private readonly repo: InteriorCalendarRepository,
  ) {}

  async execute(eventId: string, applicationSlug?: string) {
    try {
      await this.repo.deleteEvent(eventId, applicationSlug ?? SLUG_DFLT);
    } catch (e) {
      mapRepoErr(e);
    }
  }
}

export { parseRange };
