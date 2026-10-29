import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import { CreateInteriorProjectUseCase } from '../../application/use-cases/interior-projects/create-interior-project.use-case';
import { GetInteriorProjectByIdUseCase } from '../../application/use-cases/interior-projects/get-interior-project-by-id.use-case';
import { ListInteriorProjectsUseCase } from '../../application/use-cases/interior-projects/list-interior-projects.use-case';
import { UpdateInteriorProjectUseCase } from '../../application/use-cases/interior-projects/update-interior-project.use-case';
import {
  ListInteriorClientPaymentsUseCase,
  SummarizeInteriorClientProjectsUseCase,
} from '../../application/use-cases/interior-projects/interior-client-projects.use-cases';
import { GetInteriorProjectStatsUseCase } from '../../application/use-cases/interior-projects/get-interior-project-stats.use-case';
import type {
  InteriorProjectStatus,
  InteriorProjectType,
} from '../../domain/repositories/interior-project.repository';
import {
  CreateInteriorProjectActivityUseCase,
  DeleteInteriorProjectActivityUseCase,
} from '../../application/use-cases/interior-projects/interior-project-activities.use-cases';
import { CreateInteriorProjectDto } from '../dtos/interiorismo-projects/create-interior-project.dto';
import { CreateInteriorProjectActivityDto } from '../dtos/interiorismo-projects/create-interior-project-activity.dto';
import { UpdateInteriorProjectDto } from '../dtos/interiorismo-projects/update-interior-project.dto';

@ApiTags('Interiorismo — Proyectos')
@RequiresApplication('interiorismo')
@Controller('interiorismo-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoProjectsController {
  constructor(
    private readonly listUc: ListInteriorProjectsUseCase,
    private readonly getByIdUc: GetInteriorProjectByIdUseCase,
    private readonly createUc: CreateInteriorProjectUseCase,
    private readonly updateUc: UpdateInteriorProjectUseCase,
    private readonly statsUc: GetInteriorProjectStatsUseCase,
    private readonly clientSummaryUc: SummarizeInteriorClientProjectsUseCase,
    private readonly clientPaymentsUc: ListInteriorClientPaymentsUseCase,
    private readonly createActivityUc: CreateInteriorProjectActivityUseCase,
    private readonly deleteActivityUc: DeleteInteriorProjectActivityUseCase,
  ) {}

  private parseDate(s?: string | null): Date | null {
    if (!s?.trim()) return null;
    const d = new Date(s.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }

  @Get()
  @ApiOperation({ summary: 'Listar proyectos interiorismo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({
    name: 'inProgressOnly',
    required: false,
    description:
      'true = DESIGN, QUOTE, APPROVED, IN_PROGRESS (proyectos activos)',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filtrar proyectos por cliente',
  })
  @ApiQuery({ name: 'projectType', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Proyectos donde el agente es responsable (cualquier rol)',
  })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: InteriorProjectStatus,
    @Query('inProgressOnly') inProgressOnly?: string,
    @Query('clientId') clientId?: string,
    @Query('projectType') projectType?: InteriorProjectType,
    @Query('agentId') agentId?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      status,
      inProgressOnly: inProgressOnly === 'true',
      clientId: clientId?.trim() || undefined,
      projectType: projectType || undefined,
      agentId: agentId?.trim() || undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Indicadores del listado de proyectos' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.statsUc.execute(applicationSlug ?? 'interiorismo');
  }

  @Get('clients/summary')
  @ApiOperation({ summary: 'Proyectos por cliente (total y activos)' })
  @ApiQuery({
    name: 'clientIds',
    required: true,
    description: 'ids separados por coma',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  clientsSummary(
    @Query('clientIds') clientIds?: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.clientSummaryUc.execute(
      applicationSlug ?? 'interiorismo',
      (clientIds ?? '').split(','),
    );
  }

  @Get('clients/:clientId/payments')
  @ApiOperation({ summary: 'Cobros de un cliente en todos sus proyectos' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  clientPayments(
    @Param('clientId') clientId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.clientPaymentsUc.execute(
      applicationSlug ?? 'interiorismo',
      clientId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'interiorismo');
  }

  @Post()
  @ApiOperation({ summary: 'Crear proyecto' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateInteriorProjectDto) {
    return this.createUc.execute({
      applicationSlug: dto.applicationSlug ?? 'interiorismo',
      code: dto.code,
      name: dto.name,
      clientId: dto.clientId,
      projectType: dto.projectType,
      status: dto.status,
      addressLine: dto.addressLine,
      city: dto.city ?? null,
      interventionLevel: dto.interventionLevel ?? null,
      executionTimeNote: dto.executionTimeNote ?? null,
      currency: dto.currency ?? 'PEN',
      defaultUtilityPct: dto.defaultUtilityPct ?? null,
      defaultIgvPct: dto.defaultIgvPct ?? null,
      defaultOverheadPct: dto.defaultOverheadPct ?? null,
      exchangeRate: dto.exchangeRate ?? null,
      districtId: dto.districtId ?? null,
      areaSqm: dto.areaSqm ?? null,
      levelsCount: dto.levelsCount ?? null,
      environmentsNote: dto.environmentsNote,
      startDate: this.parseDate(dto.startDate ?? undefined),
      estimatedEndDate: this.parseDate(dto.estimatedEndDate ?? undefined),
      designerAgentId: dto.designerAgentId ?? null,
      architectJrAgentId: dto.architectJrAgentId ?? null,
      architectSrAgentId: dto.architectSrAgentId ?? null,
      supervisorAgentId: dto.supervisorAgentId ?? null,
      commercialAgentId: dto.commercialAgentId ?? null,
      estimatedBudget: dto.estimatedBudget ?? null,
      projectedCost: dto.projectedCost ?? null,
      expectedMargin: dto.expectedMargin ?? null,
      progressPct: dto.progressPct ?? null,
    });
  }

  @Post(':id/activities')
  @ApiOperation({
    summary: 'Registrar actividad (nota, reunión, tarea u otra)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 201, description: 'Proyecto con la actividad nueva' })
  async createActivity(
    @Param('id') id: string,
    @Body() dto: CreateInteriorProjectActivityDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createActivityUc.execute(
      id,
      applicationSlug ?? 'interiorismo',
      {
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description ?? null,
        occurredAt: new Date(dto.occurredAt),
      },
    );
  }

  @Delete(':id/activities/:activityId')
  @ApiOperation({ summary: 'Eliminar actividad registrada a mano' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200, description: 'Proyecto sin la actividad' })
  async deleteActivity(
    @Param('id') id: string,
    @Param('activityId') activityId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteActivityUc.execute(
      id,
      activityId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteriorProjectDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'interiorismo', {
      code: dto.code,
      name: dto.name,
      clientId: dto.clientId,
      projectType: dto.projectType,
      status: dto.status,
      addressLine: dto.addressLine,
      city: dto.city,
      interventionLevel: dto.interventionLevel,
      executionTimeNote: dto.executionTimeNote,
      currency: dto.currency,
      defaultUtilityPct: dto.defaultUtilityPct ?? undefined,
      defaultIgvPct: dto.defaultIgvPct ?? undefined,
      defaultOverheadPct: dto.defaultOverheadPct ?? undefined,
      exchangeRate: dto.exchangeRate,
      districtId: dto.districtId,
      areaSqm: dto.areaSqm ?? undefined,
      levelsCount: dto.levelsCount ?? undefined,
      environmentsNote: dto.environmentsNote,
      startDate:
        dto.startDate === undefined ? undefined : this.parseDate(dto.startDate),
      estimatedEndDate:
        dto.estimatedEndDate === undefined
          ? undefined
          : this.parseDate(dto.estimatedEndDate),
      designerAgentId: dto.designerAgentId,
      architectJrAgentId: dto.architectJrAgentId,
      architectSrAgentId: dto.architectSrAgentId,
      supervisorAgentId: dto.supervisorAgentId,
      commercialAgentId: dto.commercialAgentId,
      estimatedBudget: dto.estimatedBudget ?? undefined,
      projectedCost: dto.projectedCost ?? undefined,
      expectedMargin: dto.expectedMargin ?? undefined,
      progressPct: dto.progressPct ?? undefined,
    });
  }
}
