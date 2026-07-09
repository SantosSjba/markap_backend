import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ARQUITECTURA_CALENDAR_REPOSITORY,
  type CreateArquitecturaCalendarEventPayload,
  type ArquitecturaCalendarFeedFilters,
  type ArquitecturaCalendarRepository,
  type UpdateArquitecturaCalendarEventPayload,
} from '@domain/repositories/arquitectura-calendar.repository';

export type CreateArquitecturaCalendarEventInput = Omit<CreateArquitecturaCalendarEventPayload, 'applicationId'>;
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

const SLUG_DFLT = 'arquitectura';

const MANUAL_TYPES = ['MEETING', 'VISIT', 'INSTALLATION', 'DEADLINE', 'TEAM_BLOCK'] as const;

function assertManualType(v: string) {
  if (!(MANUAL_TYPES as readonly string[]).includes(v)) {
    throw new BadRequestException(`Tipo de evento invÃ¡lido. Use: ${MANUAL_TYPES.join(', ')}`);
  }
}

function parseRange(from?: string, to?: string): { from: Date; to: Date } {
  if (!from?.trim() || !to?.trim()) throw new BadRequestException('ParÃ¡metros from y to son requeridos (ISO date)');
  const a = new Date(from.trim());
  const b = new Date(to.trim());
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    throw new BadRequestException('Fechas from/to invÃ¡lidas');
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
export class GetArquitecturaCalendarFeedUseCase {
  constructor(
    @Inject(ARQUITECTURA_CALENDAR_REPOSITORY)
    private readonly repo: ArquitecturaCalendarRepository,
  ) {}

  execute(filters: ArquitecturaCalendarFeedFilters) {
    return this.repo.getFeed(filters);
  }
}

@Injectable()
export class CreateArquitecturaCalendarEventUseCase {
  constructor(
    @Inject(ARQUITECTURA_CALENDAR_REPOSITORY)
    private readonly repo: ArquitecturaCalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(applicationSlug: string | undefined, payload: CreateArquitecturaCalendarEventInput) {
    assertManualType(payload.eventType);
    const slug = applicationSlug?.trim() || SLUG_DFLT;
    const applicationId = await this.repo.resolveApplicationId(slug);
    if (!applicationId) throw new NotFoundException('AplicaciÃ³n no encontrada');

    const pid = payload.projectId?.trim() || null;
    if (pid) {
      const ok = await this.prisma.arquitecturaProject.count({
        where: { id: pid, applicationId, deletedAt: null },
      });
      if (!ok) throw new BadRequestException('El proyecto no pertenece a arquitectura');
    }

    if (payload.assignedAgentId?.trim()) {
      const aid = payload.assignedAgentId.trim();
      const agentOk = await this.prisma.agent.count({
        where: { id: aid, applicationId, deletedAt: null },
      });
      if (!agentOk) throw new BadRequestException('Agente no vÃ¡lido para esta aplicaciÃ³n');
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
export class UpdateArquitecturaCalendarEventUseCase {
  constructor(
    @Inject(ARQUITECTURA_CALENDAR_REPOSITORY)
    private readonly repo: ArquitecturaCalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    eventId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaCalendarEventPayload,
  ) {
    if (payload.eventType !== undefined) assertManualType(payload.eventType);
    const slug = applicationSlug?.trim() || SLUG_DFLT;
    const applicationId = await this.repo.resolveApplicationId(slug);
    if (!applicationId) throw new NotFoundException('AplicaciÃ³n no encontrada');

    if (payload.projectId !== undefined && payload.projectId?.trim()) {
      const pid = payload.projectId.trim();
      const ok = await this.prisma.arquitecturaProject.count({
        where: { id: pid, applicationId, deletedAt: null },
      });
      if (!ok) throw new BadRequestException('El proyecto no pertenece a arquitectura');
    }

    if (payload.assignedAgentId !== undefined && payload.assignedAgentId?.trim()) {
      const aid = payload.assignedAgentId.trim();
      const agentOk = await this.prisma.agent.count({
        where: { id: aid, applicationId, deletedAt: null },
      });
      if (!agentOk) throw new BadRequestException('Agente no vÃ¡lido para esta aplicaciÃ³n');
    }

    try {
      return await this.repo.updateEvent(eventId, slug, payload);
    } catch (e) {
      mapRepoErr(e);
    }
  }
}

@Injectable()
export class DeleteArquitecturaCalendarEventUseCase {
  constructor(
    @Inject(ARQUITECTURA_CALENDAR_REPOSITORY)
    private readonly repo: ArquitecturaCalendarRepository,
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
