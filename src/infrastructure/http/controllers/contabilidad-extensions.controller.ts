import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadExtensionsOperationsService } from '../../../application/services/contabilidad-extensions-operations.service';
import type {
  CreateElectronicDocumentLogInput,
  CreateJournalTemplateInput,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
  UpsertIncomeTaxPeriodInput,
} from '@domain/repositories/contabilidad-extensions.repository';

@ApiTags('Contabilidad — Extensiones')
@Controller('contabilidad-extensions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadExtensionsController {
  constructor(private readonly extensions: ContabilidadExtensionsOperationsService) {}

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Listar tipos de cambio por rango de fechas' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listExchangeRates(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('currencyCode') currencyCode?: string,
  ) {
    return this.extensions.listExchangeRates(applicationSlug, { dateFrom, dateTo, currencyCode });
  }

  @Post('exchange-rates')
  @ApiOperation({ summary: 'Crear o actualizar tipo de cambio' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  upsertExchangeRate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: UpsertExchangeRateInput,
  ) {
    return this.extensions.upsertExchangeRate(applicationSlug, body);
  }

  @Get('journal-templates')
  @ApiOperation({ summary: 'Listar plantillas de asiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listJournalTemplates(@Query('applicationSlug') applicationSlug?: string) {
    return this.extensions.listJournalTemplates(applicationSlug);
  }

  @Get('journal-templates/:id')
  @ApiOperation({ summary: 'Detalle de plantilla de asiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getJournalTemplate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
  ) {
    return this.extensions.getJournalTemplate(applicationSlug, id);
  }

  @Post('journal-templates')
  @ApiOperation({ summary: 'Crear plantilla de asiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createJournalTemplate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateJournalTemplateInput,
  ) {
    return this.extensions.createJournalTemplate(applicationSlug, body);
  }

  @Patch('journal-templates/:id')
  @ApiOperation({ summary: 'Actualizar plantilla de asiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateJournalTemplate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateJournalTemplateInput,
  ) {
    return this.extensions.updateJournalTemplate(applicationSlug, id, body);
  }

  @Delete('journal-templates/:id')
  @ApiOperation({ summary: 'Eliminar plantilla de asiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteJournalTemplate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
  ) {
    return this.extensions.deleteJournalTemplate(applicationSlug, id);
  }

  @Post('journal-templates/:id/apply')
  @ApiOperation({ summary: 'Aplicar plantilla — devuelve estructura de líneas para asiento borrador' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  applyJournalTemplate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
  ) {
    return this.extensions.applyJournalTemplate(applicationSlug, id);
  }

  @Post('inventory-snapshots/generate')
  @ApiOperation({ summary: 'Generar snapshot de inventarios y balances desde balance de comprobación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  generateInventorySnapshot(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('periodId') periodId: string,
  ) {
    return this.extensions.generateInventorySnapshot(applicationSlug, periodId);
  }

  @Get('inventory-snapshots')
  @ApiOperation({ summary: 'Listar snapshots de inventarios y balances' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  listInventorySnapshots(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.extensions.listInventorySnapshots(applicationSlug, periodId ?? '');
  }

  @Get('electronic-document-logs')
  @ApiOperation({ summary: 'Listar trazabilidad CPE (sin OSE)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listElectronicDocumentLogs(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('documentKind') documentKind?: string,
    @Query('search') search?: string,
  ) {
    return this.extensions.listElectronicDocumentLogs(applicationSlug, { periodId, documentKind, search });
  }

  @Post('electronic-document-logs')
  @ApiOperation({ summary: 'Registrar metadatos CPE' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createElectronicDocumentLog(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateElectronicDocumentLogInput,
  ) {
    return this.extensions.createElectronicDocumentLog(applicationSlug, body);
  }

  @Get('income-tax-summary')
  @ApiOperation({ summary: 'Estimación renta del periodo (EEFF + cuenta 4012)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  getIncomeTaxSummary(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.extensions.getIncomeTaxSummary(applicationSlug, periodId ?? '');
  }

  @Get('income-tax-detail')
  @ApiOperation({ summary: 'Detalle IR: ajustes, retenciones, pagos a cuenta y tendencia anual' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  getIncomeTaxDetail(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.extensions.getIncomeTaxDetail(applicationSlug, periodId ?? '');
  }

  @Put('income-tax-period')
  @ApiOperation({ summary: 'Guardar ajustes y pago a cuenta del periodo (borrador IR)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  upsertIncomeTaxPeriod(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('periodId') periodId: string,
    @Body() body: UpsertIncomeTaxPeriodInput,
  ) {
    return this.extensions.upsertIncomeTaxPeriod(applicationSlug, periodId, body);
  }

  @Get('income-tax-export')
  @ApiOperation({ summary: 'Export borrador declaración renta (JSON)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  exportIncomeTaxDraft(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.extensions.exportIncomeTaxDraft(applicationSlug, periodId ?? '');
  }
}
