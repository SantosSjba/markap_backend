import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  AddInteriorBudgetAttachmentUseCase,
  AddInteriorBudgetCommentUseCase,
  CreateInteriorBudgetUseCase,
  DuplicateInteriorBudgetUseCase,
  DeleteInteriorBudgetUseCase,
  GetInteriorBudgetByIdUseCase,
  ListInteriorBudgetsUseCase,
  RenderInteriorBudgetHtmlUseCase,
  UpdateInteriorBudgetUseCase,
} from '../../../application/use-cases/interior-budgets';
import type {
  CreateInteriorBudgetPayload,
  InteriorBudgetLevelInput,
  UpdateInteriorBudgetPayload,
} from '@domain/repositories/interior-budget.repository';
import { AddInteriorBudgetAttachmentDto } from '../dtos/interiorismo-budgets/add-interior-budget-attachment.dto';
import { AddInteriorBudgetCommentDto } from '../dtos/interiorismo-budgets/add-interior-budget-comment.dto';
import { CreateInteriorBudgetDto } from '../dtos/interiorismo-budgets/create-interior-budget.dto';
import { UpdateInteriorBudgetDto } from '../dtos/interiorismo-budgets/update-interior-budget.dto';

@ApiTags('Interiorismo — Presupuestos')
@Controller('interiorismo-budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoBudgetsController {
  constructor(
    private readonly listUc: ListInteriorBudgetsUseCase,
    private readonly getByIdUc: GetInteriorBudgetByIdUseCase,
    private readonly createUc: CreateInteriorBudgetUseCase,
    private readonly updateUc: UpdateInteriorBudgetUseCase,
    private readonly duplicateUc: DuplicateInteriorBudgetUseCase,
    private readonly deleteUc: DeleteInteriorBudgetUseCase,
    private readonly commentUc: AddInteriorBudgetCommentUseCase,
    private readonly attachmentUc: AddInteriorBudgetAttachmentUseCase,
    private readonly pdfHtmlUc: RenderInteriorBudgetHtmlUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos interiorismo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      projectId: projectId?.trim() || undefined,
      clientId: clientId?.trim() || undefined,
      status: status?.trim() || undefined,
    });
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Vista imprimible HTML (exportar a PDF desde el navegador)' })
  @ApiProduces('text/html')
  @ApiQuery({ name: 'applicationSlug', required: false })
  async pdfHtml(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.pdfHtmlUc.execute(id, applicationSlug ?? 'interiorismo');
    res.type('html').send(html);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle presupuesto con jerarquía completa' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'interiorismo');
  }

  @Post()
  @ApiOperation({ summary: 'Crear presupuesto (Cliente implícito vía proyecto)' })
  async create(@Body() dto: CreateInteriorBudgetDto, @Request() req: AuthenticatedRequest) {
    const payload: CreateInteriorBudgetPayload = {
      projectId: dto.projectId,
      code: dto.code,
      version: dto.version,
      title: dto.title ?? null,
      status: dto.status,
      defaultIgvPct: dto.defaultIgvPct,
      levels: dto.levels as InteriorBudgetLevelInput[] | undefined,
    };
    return this.createUc.execute(payload, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar presupuesto (solo borrador / DRAFT)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'interiorismo');
    return { ok: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cabecera y/o reemplazar estructura' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteriorBudgetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const payload: UpdateInteriorBudgetPayload = {
      title: dto.title,
      status: dto.status,
      defaultIgvPct: dto.defaultIgvPct,
      levels: dto.levels as InteriorBudgetLevelInput[] | undefined,
    };
    return this.updateUc.execute(id, payload, req.user.sub);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar como nueva versión (mismo código, version++)' })
  async duplicate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.duplicateUc.execute(id, req.user.sub);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Agregar comentario' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddInteriorBudgetCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentUc.execute(id, dto.body, req.user.sub);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Registrar adjunto (URL)' })
  async addAttachment(
    @Param('id') id: string,
    @Body() dto: AddInteriorBudgetAttachmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.attachmentUc.execute(id, dto.title, dto.fileUrl, req.user.sub);
  }
}
