import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ARQUITECTURA_EXECUTION_REPOSITORY,
  type CreateArquitecturaExecutionActualCostPayload,
  type CreateArquitecturaExecutionEvidencePayload,
  type CreateArquitecturaExecutionIncidentPayload,
  type CreateArquitecturaExecutionTaskPayload,
  type ArquitecturaExecutionRepository,
  type UpdateArquitecturaExecutionIncidentPayload,
  type UpdateArquitecturaExecutionTaskPayload,
} from '@domain/repositories/arquitectura-execution.repository';
import { UpdateArquitecturaProjectUseCase } from '../arquitectura-projects/update-arquitectura-project.use-case';

const SLUG_DFLT = 'arquitectura';

const PHASES = ['DESIGN', 'PURCHASES', 'PRODUCTION', 'INSTALLATION'] as const;
const KANBAN = ['BACKLOG', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;
const EVIDENCE_KINDS = ['PHOTO', 'DOCUMENT', 'OTHER'] as const;
const SEVERITY = ['LOW', 'MEDIUM', 'HIGH'] as const;
const INCIDENT_STATUS = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
const COST_CAT = ['LABOR', 'MATERIAL', 'EXPENSE', 'TRANSPORT'] as const;

function assertPhase(v: string) {
  if (!(PHASES as readonly string[]).includes(v)) {
    throw new BadRequestException(
      `Fase invÃ¡lida. Use: ${PHASES.join(', ')}`,
    );
  }
}

function assertKanban(v: string) {
  if (!(KANBAN as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado Kanban invÃ¡lido: ${KANBAN.join(', ')}`);
  }
}

function assertEvidenceKind(v: string) {
  if (!(EVIDENCE_KINDS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Tipo de evidencia invÃ¡lido: ${EVIDENCE_KINDS.join(', ')}`);
  }
}

function assertSeverity(v: string) {
  if (!(SEVERITY as readonly string[]).includes(v)) {
    throw new BadRequestException(`Severidad invÃ¡lida: ${SEVERITY.join(', ')}`);
  }
}

function assertIncidentStatus(v: string) {
  if (!(INCIDENT_STATUS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado de incidencia invÃ¡lido: ${INCIDENT_STATUS.join(', ')}`);
  }
}

function assertCostCat(v: string) {
  if (!(COST_CAT as readonly string[]).includes(v)) {
    throw new BadRequestException(`CategorÃ­a de costo invÃ¡lida: ${COST_CAT.join(', ')}`);
  }
}

async function assertProject(
  repo: ArquitecturaExecutionRepository,
  projectId: string,
  applicationSlug?: string,
) {
  const slug = applicationSlug?.trim() || SLUG_DFLT;
  const ok = await repo.ensureProjectScope(projectId, slug);
  if (!ok) throw new NotFoundException('Proyecto no encontrado');
}

@Injectable()
export class GetArquitecturaExecutionOverviewUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  execute(projectId: string, applicationSlug?: string) {
    return this.repo.getOverview(projectId, applicationSlug ?? SLUG_DFLT);
  }
}

@Injectable()
export class CreateArquitecturaExecutionTaskUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateArquitecturaExecutionTaskPayload) {
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
export class UpdateArquitecturaExecutionTaskUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(
    projectId: string,
    taskId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaExecutionTaskPayload,
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
export class DeleteArquitecturaExecutionTaskUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, taskId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteTask(projectId, taskId);
    if (!ok) throw new NotFoundException('Tarea no encontrada');
  }
}

@Injectable()
export class CreateArquitecturaExecutionEvidenceUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateArquitecturaExecutionEvidencePayload) {
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
export class DeleteArquitecturaExecutionEvidenceUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, evidenceId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteEvidence(projectId, evidenceId);
    if (!ok) throw new NotFoundException('Evidencia no encontrada');
  }
}

@Injectable()
export class CreateArquitecturaExecutionIncidentUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateArquitecturaExecutionIncidentPayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertSeverity(payload.severity);
    return this.repo.createIncident(projectId, payload);
  }
}

@Injectable()
export class UpdateArquitecturaExecutionIncidentUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(
    projectId: string,
    incidentId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaExecutionIncidentPayload,
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
export class CreateArquitecturaExecutionActualCostUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, applicationSlug: string | undefined, payload: CreateArquitecturaExecutionActualCostPayload) {
    await assertProject(this.repo, projectId, applicationSlug);
    assertCostCat(payload.costCategory);
    return this.repo.createActualCost(projectId, payload);
  }
}

@Injectable()
export class DeleteArquitecturaExecutionActualCostUseCase {
  constructor(
    @Inject(ARQUITECTURA_EXECUTION_REPOSITORY)
    private readonly repo: ArquitecturaExecutionRepository,
  ) {}

  async execute(projectId: string, costId: string, applicationSlug: string | undefined) {
    await assertProject(this.repo, projectId, applicationSlug);
    const ok = await this.repo.deleteActualCost(projectId, costId);
    if (!ok) throw new NotFoundException('Costo no encontrado');
  }
}

@Injectable()
export class PatchArquitecturaExecutionProgressUseCase {
  constructor(private readonly updateProject: UpdateArquitecturaProjectUseCase) {}

  execute(projectId: string, applicationSlug: string | undefined, progressPct: number) {
    if (progressPct < 0 || progressPct > 100) {
      throw new BadRequestException('Avance debe estar entre 0 y 100');
    }
    return this.updateProject.execute(projectId, applicationSlug ?? SLUG_DFLT, { progressPct });
  }
}
