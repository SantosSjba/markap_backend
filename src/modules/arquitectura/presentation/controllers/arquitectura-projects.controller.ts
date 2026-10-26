import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
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
import { ListArquitecturaProjectBudgetSummariesUseCase } from '../../application/use-cases/arquitectura-project-budget/list-budget-summaries.use-case';
import { CreateArquitecturaProjectUseCase } from '../../application/use-cases/arquitectura-projects/create-arquitectura-project.use-case';
import { GetArquitecturaProjectByIdUseCase } from '../../application/use-cases/arquitectura-projects/get-arquitectura-project-by-id.use-case';
import { ListArquitecturaProjectsUseCase } from '../../application/use-cases/arquitectura-projects/list-arquitectura-projects.use-case';
import { UpdateArquitecturaProjectUseCase } from '../../application/use-cases/arquitectura-projects/update-arquitectura-project.use-case';
import type { ArquitecturaProjectStatus } from '../../domain/repositories/arquitectura-project.repository';
import { CreateArquitecturaProjectDto } from '../dtos/arquitectura-projects/create-arquitectura-project.dto';
import { UpdateArquitecturaProjectDto } from '../dtos/arquitectura-projects/update-arquitectura-project.dto';

@ApiTags('Arquitectura — Proyectos')
@RequiresApplication('arquitectura')
@Controller('arquitectura-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaProjectsController {
  constructor(
    private readonly listUc: ListArquitecturaProjectsUseCase,
    private readonly getByIdUc: GetArquitecturaProjectByIdUseCase,
    private readonly createUc: CreateArquitecturaProjectUseCase,
    private readonly updateUc: UpdateArquitecturaProjectUseCase,
    private readonly listBudgetSummariesUc: ListArquitecturaProjectBudgetSummariesUseCase,
  ) {}

  private parseDate(s?: string | null): Date | null {
    if (!s?.trim()) return null;
    const d = new Date(s.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }

  @Get()
  @ApiOperation({ summary: 'Listar proyectos arquitectura' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({
    name: 'inProgressOnly',
    required: false,
    description: 'true = APPROVED, IN_PROGRESS (en ejecución)',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filtrar proyectos por cliente',
  })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: ArquitecturaProjectStatus,
    @Query('inProgressOnly') inProgressOnly?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      status,
      inProgressOnly: inProgressOnly === 'true',
      clientId: clientId?.trim() || undefined,
    });
  }

  @Get('budget-summaries')
  @ApiOperation({
    summary:
      'Listado transversal de proyectos con resumen de presupuesto (hub)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({
    name: 'onlyWithBudget',
    required: false,
    description:
      'true = solo proyectos con al menos una sección de presupuesto',
  })
  @ApiResponse({ status: 200 })
  async listBudgetSummaries(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: ArquitecturaProjectStatus,
    @Query('clientId') clientId?: string,
    @Query('onlyWithBudget') onlyWithBudget?: string,
  ) {
    return this.listBudgetSummariesUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      status,
      clientId: clientId?.trim() || undefined,
      onlyWithBudget: onlyWithBudget === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'arquitectura');
  }

  @Post()
  @ApiOperation({ summary: 'Crear proyecto' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateArquitecturaProjectDto) {
    return this.createUc.execute({
      applicationSlug: dto.applicationSlug ?? 'arquitectura',
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

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArquitecturaProjectDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'arquitectura', {
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
