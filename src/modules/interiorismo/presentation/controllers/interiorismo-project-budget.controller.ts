import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  BadRequestException,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { BudgetAttachmentDto } from '../../../../shared/presentation/dtos/uploads/upload-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../../shared/types/uploaded-file.types';
import {
  DeleteInteriorProjectBudgetAttachmentUseCase,
  ListInteriorProjectBudgetAttachmentsUseCase,
  UploadInteriorProjectBudgetAttachmentUseCase,
} from '../../application/use-cases/interior-project-budget/budget-attachments.use-case';
import { DuplicateInteriorProjectBudgetSnapshotUseCase } from '../../application/use-cases/interior-project-budget/duplicate-budget-snapshot.use-case';
import { ImportInteriorProjectBudgetFromExcelUseCase } from '../../application/use-cases/interior-project-budget/import-budget-from-excel.use-case';
import { ExportInteriorProjectBudgetExcelUseCase } from '../../application/use-cases/interior-project-budget/export-budget-excel.use-case';
import {
  ActivateInteriorBudgetVersionUseCase,
  CreateInteriorBudgetRowsUseCase,
  CreateInteriorBudgetSupplierPaymentUseCase,
  DeleteInteriorBudgetRowUseCase,
  DeleteInteriorBudgetSupplierPaymentUseCase,
  GetInteriorProjectBudgetUseCase,
  GetInteriorProjectSettlementUseCase,
  MoveInteriorBudgetRowUseCase,
  UpdateInteriorBudgetHeaderUseCase,
  UpdateInteriorBudgetRowUseCase,
} from '../../application/use-cases/interior-project-budget/project-budget.use-cases';
import { RenderInteriorProjectBudgetHtmlUseCase } from '../../application/use-cases/interior-project-budget/render-interior-project-budget-html.use-case';
import { SyncInteriorProjectBudgetFromExecutionUseCase } from '../../application/use-cases/interior-project-budget/sync-budget-from-execution.use-case';
import {
  CreateBudgetRowsDto,
  CreateBudgetSupplierPaymentDto,
  MoveBudgetRowDto,
  UpdateBudgetHeaderDto,
  UpdateBudgetRowDto,
} from '../dtos/interiorismo-project-budget/project-budget.dto';

@ApiTags('Interiorismo — Presupuesto por proyecto')
@RequiresApplication('interiorismo')
@Controller('interiorismo-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoProjectBudgetController {
  constructor(
    private readonly getBudgetUc: GetInteriorProjectBudgetUseCase,
    private readonly getSettlementUc: GetInteriorProjectSettlementUseCase,
    private readonly updateHeaderUc: UpdateInteriorBudgetHeaderUseCase,
    private readonly createRowsUc: CreateInteriorBudgetRowsUseCase,
    private readonly updateRowUc: UpdateInteriorBudgetRowUseCase,
    private readonly moveRowUc: MoveInteriorBudgetRowUseCase,
    private readonly deleteRowUc: DeleteInteriorBudgetRowUseCase,
    private readonly createSupplierPaymentUc: CreateInteriorBudgetSupplierPaymentUseCase,
    private readonly deleteSupplierPaymentUc: DeleteInteriorBudgetSupplierPaymentUseCase,
    private readonly activateVersionUc: ActivateInteriorBudgetVersionUseCase,
    private readonly exportExcelUc: ExportInteriorProjectBudgetExcelUseCase,
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

  private optionalDate(s: string | null | undefined): Date | null | undefined {
    if (s === undefined) return undefined;
    return s ? this.parseDate(s) : null;
  }

  @Get(':projectId/budget/pdf')
  @ApiOperation({
    summary: 'Vista imprimible HTML del presupuesto cliente (exportar a PDF)',
  })
  @ApiProduces('text/html')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async budgetPdfHtml(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.renderPdfHtmlUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
    res.type('html').send(html);
  }

  @Get(':projectId/budget')
  @ApiOperation({
    summary:
      'Hoja del presupuesto activo (filas en árbol con montos y totales)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  getBudget(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getBudgetUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Get(':projectId/settlement')
  @ApiOperation({ summary: 'Liquidación financiera del proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  getSettlement(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getSettlementUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/duplicate-snapshot')
  @ApiOperation({
    summary:
      'Duplicar presupuesto como snapshot (solo partidas cliente, sin compras)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 201 })
  duplicateSnapshot(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.duplicateSnapshotUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/sync-from-execution')
  @ApiOperation({
    summary:
      'Sincronizar costo real de partidas desde costos de ejecución (por concepto)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  syncFromExecution(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.syncFromExecutionUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/import-excel')
  @ApiOperation({ summary: 'Importar presupuesto desde Excel (.xlsx)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({
    name: 'replace',
    required: false,
    description: 'true = reemplaza las filas existentes',
  })
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
    @Body() body: BudgetAttachmentDto,
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

  @Get(':projectId/budget/export.xlsx')
  @ApiOperation({ summary: 'Descargar el presupuesto en Excel' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiQuery({ name: 'applicationSlug', required: false })
  async exportExcel(
    @Param('projectId') projectId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const { fileName, buffer } = await this.exportExcelUc.execute(
      projectId,
      applicationSlug ?? 'interiorismo',
    );
    res
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .attachment(fileName)
      .send(buffer);
  }

  @Patch(':projectId/budget')
  @ApiOperation({
    summary: 'Actualizar cabecera (moneda, márgenes, IGV, columnas)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateHeader(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateBudgetHeaderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateHeaderUc.execute(
      projectId,
      {
        ...dto,
        utilityPct: dto.utilityPct ?? undefined,
        overheadPct: dto.overheadPct ?? undefined,
        igvPct: dto.igvPct ?? undefined,
        issuedAt: this.optionalDate(dto.issuedAt),
        exchangeRateDate: this.optionalDate(dto.exchangeRateDate),
      },
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/rows')
  @ApiOperation({ summary: 'Agregar filas (una o varias pegadas desde Excel)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createRows(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBudgetRowsDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createRowsUc.execute(
      projectId,
      { parentId: dto.parentId ?? null, afterRowId: dto.afterRowId ?? null },
      dto.rows,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Patch(':projectId/budget/rows/:rowId')
  @ApiOperation({ summary: 'Editar celdas de una fila' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateRow(
    @Param('projectId') projectId: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateBudgetRowDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateRowUc.execute(
      projectId,
      rowId,
      dto,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/rows/:rowId/move')
  @ApiOperation({ summary: 'Mover, reordenar o (des)anidar una fila' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  moveRow(
    @Param('projectId') projectId: string,
    @Param('rowId') rowId: string,
    @Body() dto: MoveBudgetRowDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.moveRowUc.execute(
      projectId,
      rowId,
      { parentId: dto.parentId ?? null, index: dto.index },
      applicationSlug ?? 'interiorismo',
    );
  }

  @Delete(':projectId/budget/rows/:rowId')
  @ApiOperation({ summary: 'Eliminar una fila (y las filas que contiene)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteRow(
    @Param('projectId') projectId: string,
    @Param('rowId') rowId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteRowUc.execute(
      projectId,
      rowId,
      applicationSlug ?? 'interiorismo',
    );
  }

  @Post(':projectId/budget/rows/:rowId/supplier-payments')
  @ApiOperation({ summary: 'Registrar abono al proveedor de una partida' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createSupplierPayment(
    @Param('projectId') projectId: string,
    @Param('rowId') rowId: string,
    @Body() dto: CreateBudgetSupplierPaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createSupplierPaymentUc.execute(
      projectId,
      rowId,
      {
        amount: dto.amount,
        paidAt: this.parseDate(dto.paidAt),
        note: dto.note,
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

  @Post(':projectId/budget/versions/:budgetId/activate')
  @ApiOperation({ summary: 'Volver a una versión anterior del presupuesto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  activateVersion(
    @Param('projectId') projectId: string,
    @Param('budgetId') budgetId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.activateVersionUc.execute(
      projectId,
      budgetId,
      applicationSlug ?? 'interiorismo',
    );
  }
}
