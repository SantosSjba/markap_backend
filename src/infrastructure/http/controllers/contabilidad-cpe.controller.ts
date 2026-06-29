import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadCpeOperationsService } from '../../../application/services/contabilidad-cpe-operations.service';
import { CONTABILIDAD_CPE_PROVIDER } from '@domain/constants/contabilidad-cpe.defaults';
import type { UpsertCpeProviderConfigInput } from '@domain/repositories/contabilidad-cpe.repository';

@ApiTags('Contabilidad — Facturación electrónica CPE')
@Controller('contabilidad-cpe')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadCpeController {
  constructor(private readonly cpe: ContabilidadCpeOperationsService) {}

  @Get('provider-config')
  @ApiOperation({ summary: 'Configuración OSE/PSE por entidad legal' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  getProviderConfig(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
  ) {
    return this.cpe.getProviderConfig(applicationSlug, legalEntityId);
  }

  @Put('provider-config')
  @ApiOperation({ summary: 'Guardar configuración OSE/PSE' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  saveProviderConfig(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Body() body?: UpsertCpeProviderConfigInput,
  ) {
    return this.cpe.saveProviderConfig(applicationSlug, legalEntityId, body ?? { providerCode: CONTABILIDAD_CPE_PROVIDER.MOCK });
  }

  @Post('emit/sales-invoices/:invoiceId')
  @ApiOperation({ summary: 'Emitir electrónicamente un comprobante de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  emitSalesInvoice(
    @Param('invoiceId') invoiceId: string,
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
  ) {
    return this.cpe.emitSalesInvoice(applicationSlug, legalEntityId, invoiceId);
  }

  @Get('documents/:logId/xml')
  @ApiOperation({ summary: 'Descargar XML UBL del comprobante' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async downloadXml(
    @Param('logId') logId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const artifact = await this.cpe.downloadArtifact(applicationSlug, logId, 'xml');
    res.setHeader('Content-Type', artifact.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.send(artifact.content);
  }

  @Get('documents/:logId/cdr')
  @ApiOperation({ summary: 'Descargar CDR SUNAT del comprobante' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async downloadCdr(
    @Param('logId') logId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const artifact = await this.cpe.downloadArtifact(applicationSlug, logId, 'cdr');
    res.setHeader('Content-Type', artifact.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.send(artifact.content);
  }
}
