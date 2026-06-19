import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateInteriorLineItemSupplierPaymentUseCase,
  CreateInteriorProjectBudgetLineItemUseCase,
  CreateInteriorProjectBudgetSectionUseCase,
  DeleteInteriorLineItemSupplierPaymentUseCase,
  DeleteInteriorProjectBudgetLineItemUseCase,
  DeleteInteriorProjectBudgetSectionUseCase,
  GetInteriorProjectBudgetUseCase,
  GetInteriorProjectSettlementUseCase,
  RenderInteriorProjectBudgetHtmlUseCase,
  UpdateInteriorProjectBudgetLineItemUseCase,
  UpdateInteriorProjectBudgetSectionUseCase,
  DuplicateInteriorProjectBudgetSnapshotUseCase,
  SyncInteriorProjectBudgetFromExecutionUseCase,
  ImportInteriorProjectBudgetFromExcelUseCase,
  ListInteriorProjectBudgetAttachmentsUseCase,
  UploadInteriorProjectBudgetAttachmentUseCase,
  DeleteInteriorProjectBudgetAttachmentUseCase,
} from '../../../application/use-cases/interior-project-budget';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import {
  CreateLineItemSupplierPaymentDto,
  CreateProjectBudgetLineItemDto,
  CreateProjectBudgetSectionDto,
  UpdateProjectBudgetLineItemDto,
  UpdateProjectBudgetSectionDto,
} from '../dtos/interiorismo-project-budget/project-budget.dto';

@ApiTags('Interiorismo — Presupuesto por proyecto')
@Controller('interiorismo-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoProjectBudgetController {
  constructor(
    private readonly getBudgetUc: GetInteriorProjectBudgetUseCase,
    private readonly getSettlementUc: GetInteriorProjectSettlementUseCase,
    private readonly createSectionUc: CreateInteriorProjectBudgetSectionUseCase,
    private readonly updateSectionUc: UpdateInteriorProjectBudgetSectionUseCase,
    private readonly deleteSectionUc: DeleteInteriorProjectBudgetSectionUseCase,
    private readonly createLineItemUc: CreateInteriorProjectBudgetLineItemUseCase,
    private readonly updateLineItemUc: UpdateInteriorProjectBudgetLineItemUseCase,
    private readonly deleteLineItemUc: DeleteInteriorProjectBudgetLineItemUseCase,
    private readonly createSupplierPaymentUc: CreateInteriorLineItemSupplierPaymentUseCase,
    private readonly deleteSupplierPaymentUc: DeleteInteriorLineItemSupplierPaymentUseCase,
    private readonly renderPdfHtmlUc: RenderInteriorProjectBudgetHtmlUseCase,
    private readonly duplicateSnapshotUc: DuplicateInteriorProjectBudgetSnapshotUseCase,
    private readonly syncFromExecutionUc: SyncInteriorProjectBudgetFromExecutionUseCase,
    private readonly importExcelUc: ImportInteriorProjectBudgetFromExcelUseCase,
    private readonly listAttachmentsUc: ListInteriorProjectBudgetAttachmentsUseCase,
    private readonly uploadAttachmentUc: UploadInteriorProjectBudgetAttachmentUseCase,
    private readonly deleteAttachmentUc: DeleteInteriorProjectBudgetAttachmentUseCase,
  ) {}

  private parseDate(s: string): Date {
    const d = new Date(s.trim());
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  @Get(':projectId/budget/pdf')
  @ApiOperation({ summary: 'Vista imprimible HTML del presupuesto cliente (exportar a PDF)' })
  @ApiProduces('text/html')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async budgetPdfHtml(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.renderPdfHtmlUc.execute(projectId, applicationSlug ?? 'interiorismo');
    res.type('html').send(html);
  }

  @Get(':projectId/budget')
  @ApiOperation({ summary: 'Presupuesto del proyecto (secciones + partidas + totales)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  getBudget(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getBudgetUc.execute(projectId, applicationSlug ?? 'interiorismo');
  }

  @Get(':projectId/settlement')
  @ApiOperation({ summary: 'Liquidación financiera del proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  getSettlement(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getSettlementUc.execute(projectId, applicationSlug ?? 'interiorismo');
  }

  @Post(':projectId/budget/duplicate-snapshot')
  @ApiOperation({ summary: 'Duplicar presupuesto como snapshot (solo partidas cliente, sin compras)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 201 })
  duplicateSnapshot(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.duplicateSnapshotUc.execute(projectId, applicationSlug ?? 'interiorismo');
  }

  @Post(':projectId/budget/sync-from-execution')
  @ApiOperation({ summary: 'Sincronizar costo real de partidas desde costos de ejecución (por concepto)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  syncFromExecution(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.syncFromExecutionUc.execute(projectId, applicationSlug ?? 'interiorismo');
  }

  @Post(':projectId/budget/import-excel')
  @ApiOperation({ summary: 'Importar presupuesto desde Excel (.xlsx)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'replace', required: false, description: 'true = reemplaza secciones existentes' })
  @UseInterceptors(FileInterceptor('file'))
  importExcel(
    @Param('projectId') projectId: string,
    @UploadedFile() file: MulterUploadedFile | undefined,
    @Query('replace') replace?: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo Excel requerido');
    }
    return this.importExcelUc.execute(
      projectId,
      file,
      { replace: replace === 'true' },
      applicationSlug ?? 'interiorismo',
    );
  }

  @Get(':projectId/budget/attachments')
  @ApiOperation({ summary: 'Listar adjuntos del presupuesto / partida' })
  @ApiQuery({ name: 'lineItemId', required: false })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listAttachments(
    @Param('projectId') projectId: string,
    @Query('lineItemId') lineItemId?: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.listAttachmentsUc.execute(
      projectId,
      lineItemId?.trim() || null,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/attachments')
  @ApiOperation({ summary: 'Subir adjunto al presupuesto o partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('projectId') projectId: string,
    @UploadedFile() file: MulterUploadedFile | undefined,
    @Body() body: { lineItemId?: string | null; title?: string },
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.uploadAttachmentUc.execute(
      projectId,
      file,
      { lineItemId: body.lineItemId ?? null, title: body.title },
      applicationSlug ?? 'interiorismo',
    );
  }

  @Delete(':projectId/budget/attachments/:attachmentId')
  @ApiOperation({ summary: 'Eliminar adjunto del presupuesto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteAttachment(
    @Param('projectId') projectId: string,
    @Param('attachmentId') attachmentId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteAttachmentUc.execute(
      projectId,
      attachmentId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/sections')
  @ApiOperation({ summary: 'Crear sección de presupuesto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createSection(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectBudgetSectionDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createSectionUc.execute(projectId, dto, applicationSlug ?? 'interiorismo');
  }

  @Patch(':projectId/budget/sections/:sectionId')
  @ApiOperation({ summary: 'Actualizar sección' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateSection(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateProjectBudgetSectionDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateSectionUc.execute(projectId, sectionId, dto, applicationSlug ?? 'interiorismo');
  }

  @Delete(':projectId/budget/sections/:sectionId')
  @ApiOperation({ summary: 'Eliminar sección' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteSection(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteSectionUc.execute(projectId, sectionId, applicationSlug ?? 'interiorismo');
  }

  @Post(':projectId/budget/line-items')
  @ApiOperation({ summary: 'Crear partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createLineItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectBudgetLineItemDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createLineItemUc.execute(projectId, dto, applicationSlug ?? 'interiorismo');
  }

  @Patch(':projectId/budget/line-items/:lineItemId')
  @ApiOperation({ summary: 'Actualizar partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateLineItem(
    @Param('projectId') projectId: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: UpdateProjectBudgetLineItemDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateLineItemUc.execute(
      projectId,
      lineItemId,
      dto,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Delete(':projectId/budget/line-items/:lineItemId')
  @ApiOperation({ summary: 'Eliminar partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteLineItem(
    @Param('projectId') projectId: string,
    @Param('lineItemId') lineItemId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteLineItemUc.execute(projectId, lineItemId, applicationSlug ?? 'interiorismo');
  }

  @Post(':projectId/budget/supplier-payments')
  @ApiOperation({ summary: 'Registrar abono a proveedor por partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createSupplierPayment(
    @Param('projectId') projectId: string,
    @Body() dto: CreateLineItemSupplierPaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createSupplierPaymentUc.execute(
      projectId,
      {
        lineItemId: dto.lineItemId,
        paymentNumber: dto.paymentNumber,
        amount: dto.amount,
        paidAt: this.parseDate(dto.paidAt),
      },
      applicationSlug ?? 'interiorismo',
    );
  }

  @Delete(':projectId/budget/supplier-payments/:paymentId')
  @ApiOperation({ summary: 'Eliminar abono a proveedor' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteSupplierPayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteSupplierPaymentUc.execute(
      projectId,
      paymentId,
      applicationSlug ?? 'interiorismo',
    );
  }
}
