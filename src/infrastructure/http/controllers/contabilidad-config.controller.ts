import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadConfigOperationsService } from '../../../application/services/contabilidad-config-operations.service';
import type { ContabilidadCompanyProfileDto } from '@domain/repositories/contabilidad-config.repository';

@ApiTags('Contabilidad — Configuración')
@Controller('contabilidad-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadConfigController {
  constructor(private readonly contabilidadConfig: ContabilidadConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary:
      'Inicialización contable: empresa, entidades legales, periodos, PCGE, tesorería y tributos',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  @ApiQuery({ name: 'year', required: false, description: 'Año fiscal para generar periodos' })
  bootstrap(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('year') year?: string,
  ) {
    const parsedYear = year !== undefined && year !== '' ? Number(year) : undefined;
    return this.contabilidadConfig.bootstrap(applicationSlug, legalEntityId, parsedYear);
  }

  @Put('company')
  @ApiOperation({ summary: 'Datos de la empresa contable (RUC, razón social, domicilio fiscal)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateCompany(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: Partial<ContabilidadCompanyProfileDto>,
  ) {
    return this.contabilidadConfig.updateCompanyProfile(applicationSlug, body);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Parámetros tributarios y contables (IGV, régimen, agentes SUNAT)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateSettings(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      taxRegime?: string;
      isDetractionAgent?: boolean;
      isRetentionAgent?: boolean;
      isPerceptionAgent?: boolean;
      igvPercent?: number;
      currencyCode?: string;
      fiscalYearStartMonth?: number;
      amountDecimals?: number;
    },
  ) {
    return this.contabilidadConfig.updateSettings(applicationSlug, body);
  }

  @Patch('document-series/:seriesKey')
  @ApiOperation({ summary: 'Ajustar serie SUNAT y/o correlativo de comprobantes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  patchDocumentSeries(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('seriesKey') seriesKey: string,
    @Body() body: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean },
  ) {
    return this.contabilidadConfig.patchDocumentSeries(applicationSlug, seriesKey, body);
  }

  @Get('document-series/:seriesKey/preview')
  @ApiQuery({ name: 'applicationSlug', required: false })
  previewDocumentNumber(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('seriesKey') seriesKey: string,
  ) {
    return this.contabilidadConfig.previewDocumentNumber(applicationSlug, seriesKey);
  }
}
