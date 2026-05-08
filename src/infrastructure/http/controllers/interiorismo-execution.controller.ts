import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateInteriorExecutionActualCostUseCase,
  CreateInteriorExecutionEvidenceUseCase,
  CreateInteriorExecutionIncidentUseCase,
  CreateInteriorExecutionTaskUseCase,
  DeleteInteriorExecutionActualCostUseCase,
  DeleteInteriorExecutionEvidenceUseCase,
  DeleteInteriorExecutionTaskUseCase,
  GetInteriorExecutionOverviewUseCase,
  PatchInteriorExecutionProgressUseCase,
  UpdateInteriorExecutionIncidentUseCase,
  UpdateInteriorExecutionTaskUseCase,
} from '../../../application/use-cases/interior-execution';
import { CreateInteriorExecutionTaskDto } from '../dtos/interiorismo-execution/create-execution-task.dto';
import { UpdateInteriorExecutionTaskDto } from '../dtos/interiorismo-execution/update-execution-task.dto';
import { CreateInteriorExecutionEvidenceDto } from '../dtos/interiorismo-execution/create-execution-evidence.dto';
import { CreateInteriorExecutionIncidentDto } from '../dtos/interiorismo-execution/create-execution-incident.dto';
import { UpdateInteriorExecutionIncidentDto } from '../dtos/interiorismo-execution/update-execution-incident.dto';
import { CreateInteriorExecutionActualCostDto } from '../dtos/interiorismo-execution/create-execution-actual-cost.dto';
import { PatchInteriorExecutionProgressDto } from '../dtos/interiorismo-execution/patch-execution-progress.dto';

function parseIsoDate(s?: string | null): Date | null | undefined {
  if (s === undefined) return undefined;
  if (s === null || String(s).trim() === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@ApiTags('Interiorismo — Ejecución')
@Controller('interiorismo-execution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoExecutionController {
  constructor(
    private readonly overviewUc: GetInteriorExecutionOverviewUseCase,
    private readonly createTaskUc: CreateInteriorExecutionTaskUseCase,
    private readonly updateTaskUc: UpdateInteriorExecutionTaskUseCase,
    private readonly deleteTaskUc: DeleteInteriorExecutionTaskUseCase,
    private readonly createEvidenceUc: CreateInteriorExecutionEvidenceUseCase,
    private readonly deleteEvidenceUc: DeleteInteriorExecutionEvidenceUseCase,
    private readonly createIncidentUc: CreateInteriorExecutionIncidentUseCase,
    private readonly updateIncidentUc: UpdateInteriorExecutionIncidentUseCase,
    private readonly createCostUc: CreateInteriorExecutionActualCostUseCase,
    private readonly deleteCostUc: DeleteInteriorExecutionActualCostUseCase,
    private readonly patchProgressUc: PatchInteriorExecutionProgressUseCase,
  ) {}

  @Get('projects/:projectId/overview')
  @ApiOperation({ summary: 'Tablero ejecución: tareas, costos reales, evidencias, incidencias, vs presupuesto' })
  @ApiParam({ name: 'projectId' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async overview(@Param('projectId') projectId: string, @Query('applicationSlug') applicationSlug?: string) {
    const row = await this.overviewUc.execute(projectId, applicationSlug ?? 'interiorismo');
    if (!row) throw new NotFoundException('Proyecto no encontrado');
    return row;
  }

  @Patch('projects/:projectId/progress')
  @ApiOperation({ summary: 'Actualizar % avance global del proyecto' })
  async patchProgress(
    @Param('projectId') projectId: string,
    @Body() dto: PatchInteriorExecutionProgressDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.patchProgressUc.execute(projectId, applicationSlug ?? 'interiorismo', dto.progressPct);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Crear tarea de ejecución (fase + Kanban)' })
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorExecutionTaskDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createTaskUc.execute(projectId, applicationSlug ?? 'interiorismo', {
      phase: dto.phase,
      title: dto.title,
      description: dto.description ?? null,
      kanbanStatus: dto.kanbanStatus,
      plannedStart: parseIsoDate(dto.plannedStart ?? undefined) ?? null,
      plannedEnd: parseIsoDate(dto.plannedEnd ?? undefined) ?? null,
      progressPct: dto.progressPct,
    });
  }

  @Patch('projects/:projectId/tasks/:taskId')
  @ApiOperation({ summary: 'Actualizar tarea (Kanban, fechas Gantt, avance)' })
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateInteriorExecutionTaskDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateTaskUc.execute(projectId, taskId, applicationSlug ?? 'interiorismo', {
      phase: dto.phase,
      title: dto.title,
      description: dto.description,
      kanbanStatus: dto.kanbanStatus,
      sortOrder: dto.sortOrder,
      plannedStart:
        dto.plannedStart === undefined ? undefined : parseIsoDate(dto.plannedStart as string | null | undefined),
      plannedEnd:
        dto.plannedEnd === undefined ? undefined : parseIsoDate(dto.plannedEnd as string | null | undefined),
      progressPct: dto.progressPct,
    });
  }

  @Delete('projects/:projectId/tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  @ApiOperation({ summary: 'Eliminar tarea' })
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteTaskUc.execute(projectId, taskId, applicationSlug ?? 'interiorismo');
  }

  @Post('projects/:projectId/evidences')
  @ApiOperation({ summary: 'Registrar foto / evidencia' })
  async createEvidence(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorExecutionEvidenceDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const capturedAt = new Date(dto.capturedAt);
    return this.createEvidenceUc.execute(projectId, applicationSlug ?? 'interiorismo', {
      taskId: dto.taskId ?? null,
      kind: dto.kind,
      title: dto.title,
      fileUrl: dto.fileUrl,
      capturedAt,
    });
  }

  @Delete('projects/:projectId/evidences/:evidenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async deleteEvidence(
    @Param('projectId') projectId: string,
    @Param('evidenceId') evidenceId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteEvidenceUc.execute(projectId, evidenceId, applicationSlug ?? 'interiorismo');
  }

  @Post('projects/:projectId/incidents')
  @ApiOperation({ summary: 'Registrar incidencia' })
  async createIncident(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorExecutionIncidentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createIncidentUc.execute(projectId, applicationSlug ?? 'interiorismo', {
      severity: dto.severity,
      title: dto.title,
      description: dto.description ?? null,
      reportedAt: new Date(dto.reportedAt),
    });
  }

  @Patch('projects/:projectId/incidents/:incidentId')
  @ApiOperation({ summary: 'Actualizar incidencia (estado / cierre)' })
  async updateIncident(
    @Param('projectId') projectId: string,
    @Param('incidentId') incidentId: string,
    @Body() dto: UpdateInteriorExecutionIncidentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateIncidentUc.execute(projectId, incidentId, applicationSlug ?? 'interiorismo', {
      status: dto.status,
      severity: dto.severity,
      title: dto.title,
      description: dto.description,
      closedAt:
        dto.closedAt === undefined ? undefined : dto.closedAt ? new Date(dto.closedAt) : null,
    });
  }

  @Post('projects/:projectId/actual-costs')
  @ApiOperation({ summary: 'Registrar costo real (mano de obra, material, gastos)' })
  async createActualCost(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorExecutionActualCostDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const occurred = new Date(dto.occurredAt);
    if (Number.isNaN(occurred.getTime())) {
      throw new BadRequestException('Fecha del costo inválida');
    }
    return this.createCostUc.execute(projectId, applicationSlug ?? 'interiorismo', {
      costCategory: dto.costCategory,
      concept: dto.concept,
      amount: dto.amount,
      occurredAt: occurred,
      catalogMaterialId: dto.catalogMaterialId ?? null,
    });
  }

  @Delete('projects/:projectId/actual-costs/:costId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async deleteActualCost(
    @Param('projectId') projectId: string,
    @Param('costId') costId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteCostUc.execute(projectId, costId, applicationSlug ?? 'interiorismo');
  }
}
