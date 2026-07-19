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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import { GenArchivoService } from '../../../application/services/gen-archivo.service';
import {
  CreateArquitecturaExecutionActualCostUseCase,
  CreateArquitecturaExecutionEvidenceUseCase,
  CreateArquitecturaExecutionIncidentUseCase,
  CreateArquitecturaExecutionTaskUseCase,
  DeleteArquitecturaExecutionActualCostUseCase,
  DeleteArquitecturaExecutionEvidenceUseCase,
  DeleteArquitecturaExecutionTaskUseCase,
  GetArquitecturaExecutionOverviewUseCase,
  PatchArquitecturaExecutionProgressUseCase,
  UpdateArquitecturaExecutionIncidentUseCase,
  UpdateArquitecturaExecutionTaskUseCase,
} from '../../../application/use-cases/arquitectura-execution';
import { CreateArquitecturaExecutionTaskDto } from '../dtos/arquitectura-execution/create-execution-task.dto';
import { UpdateArquitecturaExecutionTaskDto } from '../dtos/arquitectura-execution/update-execution-task.dto';
import { CreateArquitecturaExecutionEvidenceDto } from '../dtos/arquitectura-execution/create-execution-evidence.dto';
import { CreateArquitecturaExecutionIncidentDto } from '../dtos/arquitectura-execution/create-execution-incident.dto';
import { UpdateArquitecturaExecutionIncidentDto } from '../dtos/arquitectura-execution/update-execution-incident.dto';
import { CreateArquitecturaExecutionActualCostDto } from '../dtos/arquitectura-execution/create-execution-actual-cost.dto';
import { PatchArquitecturaExecutionProgressDto } from '../dtos/arquitectura-execution/patch-execution-progress.dto';

function parseIsoDate(s?: string | null): Date | null | undefined {
  if (s === undefined) return undefined;
  if (s === null || String(s).trim() === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@ApiTags('Interiorismo â€” EjecuciÃ³n')
@Controller('arquitectura-execution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaExecutionController {
  constructor(
    private readonly overviewUc: GetArquitecturaExecutionOverviewUseCase,
    private readonly createTaskUc: CreateArquitecturaExecutionTaskUseCase,
    private readonly updateTaskUc: UpdateArquitecturaExecutionTaskUseCase,
    private readonly deleteTaskUc: DeleteArquitecturaExecutionTaskUseCase,
    private readonly createEvidenceUc: CreateArquitecturaExecutionEvidenceUseCase,
    private readonly deleteEvidenceUc: DeleteArquitecturaExecutionEvidenceUseCase,
    private readonly createIncidentUc: CreateArquitecturaExecutionIncidentUseCase,
    private readonly updateIncidentUc: UpdateArquitecturaExecutionIncidentUseCase,
    private readonly createCostUc: CreateArquitecturaExecutionActualCostUseCase,
    private readonly deleteCostUc: DeleteArquitecturaExecutionActualCostUseCase,
    private readonly patchProgressUc: PatchArquitecturaExecutionProgressUseCase,
    private readonly genArchivo: GenArchivoService,
  ) {}

  private async withEvidenceDownloadUrl<
    T extends { archivoId: string | null; fileUrl: string },
  >(row: T): Promise<T & { downloadUrl: string | null }> {
    if (row.archivoId) {
      const downloadUrl = await this.genArchivo.resolveDownloadUrl(row.archivoId, null);
      return { ...row, downloadUrl };
    }
    const url = row.fileUrl?.trim() || null;
    if (url && /^https?:\/\//i.test(url)) {
      return { ...row, downloadUrl: url };
    }
    return { ...row, downloadUrl: null };
  }

  @Get('projects/:projectId/overview')
  @ApiOperation({ summary: 'Tablero ejecución: tareas, costos reales, evidencias, incidencias, vs presupuesto' })
  @ApiParam({ name: 'projectId' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async overview(@Param('projectId') projectId: string, @Query('applicationSlug') applicationSlug?: string) {
    const row = await this.overviewUc.execute(projectId, applicationSlug ?? 'arquitectura');
    if (!row) throw new NotFoundException('Proyecto no encontrado');
    return {
      ...row,
      evidences: await Promise.all(row.evidences.map((e) => this.withEvidenceDownloadUrl(e))),
    };
  }

  @Patch('projects/:projectId/progress')
  @ApiOperation({ summary: 'Actualizar % avance global del proyecto' })
  async patchProgress(
    @Param('projectId') projectId: string,
    @Body() dto: PatchArquitecturaExecutionProgressDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.patchProgressUc.execute(projectId, applicationSlug ?? 'arquitectura', dto.progressPct);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Crear tarea de ejecuciÃ³n (fase + Kanban)' })
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArquitecturaExecutionTaskDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createTaskUc.execute(projectId, applicationSlug ?? 'arquitectura', {
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
    @Body() dto: UpdateArquitecturaExecutionTaskDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateTaskUc.execute(projectId, taskId, applicationSlug ?? 'arquitectura', {
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
    await this.deleteTaskUc.execute(projectId, taskId, applicationSlug ?? 'arquitectura');
  }

  @Post('projects/:projectId/evidences/upload')
  @ApiOperation({ summary: 'Subir archivo y registrar evidencia' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      taskId?: string;
      kind?: string;
      title?: string;
      capturedAt?: string;
    },
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const kind = body.kind?.trim();
    const title = body.title?.trim();
    const capturedAtRaw = body.capturedAt?.trim();
    if (!kind || !title || !capturedAtRaw) {
      throw new BadRequestException('kind, title y capturedAt son obligatorios');
    }
    const capturedAt = new Date(capturedAtRaw);
    if (Number.isNaN(capturedAt.getTime())) {
      throw new BadRequestException('capturedAt inválido');
    }
    const slug = applicationSlug ?? 'arquitectura';
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'arquitectura-execution',
        entityType: 'arquitectura_project',
        entityId: projectId,
        category: kind,
      },
      file,
    );
    const row = await this.createEvidenceUc.execute(projectId, slug, {
      taskId: body.taskId?.trim() || null,
      kind,
      title,
      fileUrl: archivo.objectKey,
      archivoId: archivo.id,
      capturedAt,
    });
    return this.withEvidenceDownloadUrl(row);
  }

  @Post('projects/:projectId/evidences')
  @ApiOperation({ summary: 'Registrar foto / evidencia (JSON legacy)' })
  async createEvidence(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArquitecturaExecutionEvidenceDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const capturedAt = new Date(dto.capturedAt);
    const row = await this.createEvidenceUc.execute(projectId, applicationSlug ?? 'arquitectura', {
      taskId: dto.taskId ?? null,
      kind: dto.kind,
      title: dto.title,
      fileUrl: dto.fileUrl,
      capturedAt,
    });
    return this.withEvidenceDownloadUrl(row);
  }

  @Delete('projects/:projectId/evidences/:evidenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async deleteEvidence(
    @Param('projectId') projectId: string,
    @Param('evidenceId') evidenceId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteEvidenceUc.execute(projectId, evidenceId, applicationSlug ?? 'arquitectura');
  }

  @Post('projects/:projectId/incidents')
  @ApiOperation({ summary: 'Registrar incidencia' })
  async createIncident(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArquitecturaExecutionIncidentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createIncidentUc.execute(projectId, applicationSlug ?? 'arquitectura', {
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
    @Body() dto: UpdateArquitecturaExecutionIncidentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateIncidentUc.execute(projectId, incidentId, applicationSlug ?? 'arquitectura', {
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
    @Body() dto: CreateArquitecturaExecutionActualCostDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const occurred = new Date(dto.occurredAt);
    if (Number.isNaN(occurred.getTime())) {
      throw new BadRequestException('Fecha del costo invÃ¡lida');
    }
    return this.createCostUc.execute(projectId, applicationSlug ?? 'arquitectura', {
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
    await this.deleteCostUc.execute(projectId, costId, applicationSlug ?? 'arquitectura');
  }
}
