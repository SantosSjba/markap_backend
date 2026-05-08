import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INTERIOR_EXECUTION_REPOSITORY,
  type CreateInteriorExecutionActualCostPayload,
  type CreateInteriorExecutionEvidencePayload,
  type CreateInteriorExecutionIncidentPayload,
  type CreateInteriorExecutionTaskPayload,
  type InteriorExecutionRepository,
  type UpdateInteriorExecutionIncidentPayload,
  type UpdateInteriorExecutionTaskPayload,
} from '@domain/repositories/interior-execution.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { UpdateInteriorProjectUseCase } from '../interior-projects/update-interior-project.use-case';

const SLUG_DFLT = 'interiorismo';

const PHASES = ['DESIGN', 'PURCHASES', 'PRODUCTION', 'INSTALLATION'] as const;
const KANBAN = ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;
const EVIDENCE_KINDS = ['PHOTO', 'DOCUMENT', 'OTHER'] as const;
const SEVERITY = ['LOW', 'MEDIUM', 'HIGH'] as const;
const INCIDENT_STATUS = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
const COST_CAT = ['LABOR', 'MATERIAL', 'EXPENSE'] as const;

function assertPhase(v: string) {
  if (!(PHASES as readonly string[]).includes(v)) {
    throw new BadRequestException(
      `Fase inválida. Use: ${PHASES.join(', ')}`,
    );
  }
}

function assertKanban(v: string) {
  if (!(KANBAN as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado Kanban inválido: ${KANBAN.join(', ')}`);
  }
}

function assertEvidenceKind(v: string) {
  if (!(EVIDENCE_KINDS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Tipo de evidencia inválido: ${EVIDENCE_KINDS.join(', ')}`);
  }
}

function assertSeverity(v: string) {
  if (!(SEVERITY as readonly string[]).includes(v)) {
    throw new BadRequestException(`Severidad inválida: ${SEVERITY.join(', ')}`);
  }
}

function assertIncidentStatus(v: string) {
  if (!(INCIDENT_STATUS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado de incidencia inválido: ${INCIDENT_STATUS.join(', ')}`);
  }
}

function assertCostCat(v: string) {
  if (!(COST_CAT as readonly string[]).includes(v)) {
    throw new BadRequestException(`Categoría de costo inválida: ${COST_CAT.join(', ')}`);
  }
}

async function assertProject(
  repo: InteriorExecutionRepository,
  projectId: string,
  applicationSlug?: string,
) {
  const slug = applicationSlug?.trim() || SLUG_DFLT;
  const ok = await repo.ensureProjectScope(projectId, slug);
  if (!ok) throw new NotFoundException('Proyecto no encontrado');
}

@Injectable()
export class GetInteriorExecutionOverviewUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  execute(projectId: string, applicationSlug?: string) {
    return this.repo.getOverview(projectId, applicationSlug ?? SLUG_DFLT);
  }
}

@Injectable()
export class CreateInteriorExecutionTaskUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateInteriorExecutionTaskPayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertPhase(payload.phase);
    if (payload.kanbanStatus) assertKanban(payload.kanbanStatus);
    if (payload.progressPct != null && (payload.progressPct < 0 || payload.progressPct > 100)) {
      throw new BadRequestException('progressPct debe estar entre 0 y 100');
    }
    return this.repo.createTask(projectId, payload);
  }
}

@Injectable()
export class UpdateInteriorExecutionTaskUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(
    projectId: string,
    taskId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorExecutionTaskPayload,
  ) {
    await assertProject(this.repo, projectId, applicationSlug);
    if (payload.phase != null) assertPhase(payload.phase);
    if (payload.kanbanStatus != null) assertKanban(payload.kanbanStatus);
    if (payload.progressPct != null && (payload.progressPct < 0 || payload.progressPct > 100)) {
      throw new BadRequestException('progressPct debe estar entre 0 y 100');
    }
    const row = await this.repo.updateTask(projectId, taskId, payload);
    if (!row) throw new NotFoundException('Tarea no encontrada');
    return row;
  }
}

@Injectable()
export class DeleteInteriorExecutionTaskUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, taskId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteTask(projectId, taskId);
    if (!ok) throw new NotFoundException('Tarea no encontrada');
  }
}

@Injectable()
export class CreateInteriorExecutionEvidenceUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateInteriorExecutionEvidencePayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertEvidenceKind(payload.kind);
    try {
      return await this.repo.createEvidence(projectId, payload);
    } catch (e) {
      if (e instanceof Error && e.message === 'TASK_SCOPE') {
        throw new BadRequestException('La tarea no pertenece a este proyecto');
      }
      throw e;
    }
  }
}

@Injectable()
export class DeleteInteriorExecutionEvidenceUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, evidenceId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteEvidence(projectId, evidenceId);
    if (!ok) throw new NotFoundException('Evidencia no encontrada');
  }
}

@Injectable()
export class CreateInteriorExecutionIncidentUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateInteriorExecutionIncidentPayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertSeverity(payload.severity);
    return this.repo.createIncident(projectId, payload);
  }
}

@Injectable()
export class UpdateInteriorExecutionIncidentUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(
    projectId: string,
    incidentId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorExecutionIncidentPayload,
  ) {
    await assertProject(this.repo, projectId, applicationSlug);
    if (payload.status != null) assertIncidentStatus(payload.status);
    if (payload.severity != null) assertSeverity(payload.severity);
    const row = await this.repo.updateIncident(projectId, incidentId, payload);
    if (!row) throw new NotFoundException('Incidencia no encontrada');
    return row;
  }
}

@Injectable()
export class CreateInteriorExecutionActualCostUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateInteriorExecutionActualCostPayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertCostCat(payload.costCategory);

    const proj = await this.prisma.interiorProject.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { applicationId: true },
    });
    if (!proj) throw new NotFoundException('Proyecto no encontrado');

    const mid = payload.catalogMaterialId?.trim();
    if (mid) {
      const mat = await this.prisma.interiorCatalogMaterial.findFirst({
        where: { id: mid, applicationId: proj.applicationId },
      });
      if (!mat) {
        throw new BadRequestException('Material del catálogo no válido para este proyecto');
      }
    }

    return this.repo.createActualCost(projectId, {
      ...payload,
      catalogMaterialId: mid ?? null,
    });
  }
}

@Injectable()
export class DeleteInteriorExecutionActualCostUseCase {
  constructor(
    @Inject(INTERIOR_EXECUTION_REPOSITORY)
    private readonly repo: InteriorExecutionRepository,
  ) {}

  async execute(projectId: string, costId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteActualCost(projectId, costId);
    if (!ok) throw new NotFoundException('Costo no encontrado');
  }
}

@Injectable()
export class PatchInteriorExecutionProgressUseCase {
  constructor(private readonly updateProject: UpdateInteriorProjectUseCase) {}

  execute(projectId: string, applicationSlug: string | undefined, progressPct: number) {
    if (progressPct < 0 || progressPct > 100) {
      throw new BadRequestException('Avance debe estar entre 0 y 100');
    }
    return this.updateProject.execute(projectId, applicationSlug ?? SLUG_DFLT, { progressPct });
  }
}
