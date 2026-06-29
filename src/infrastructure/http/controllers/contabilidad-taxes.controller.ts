import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadTaxesOperationsService } from '../../../application/services/contabilidad-taxes-operations.service';
import type {
  CreateDetraccionInput,
  CreatePerceptionInput,
  CreateRetentionInput,
  PayDetraccionInput,
} from '@domain/repositories/contabilidad-taxes.repository';

@ApiTags('Contabilidad — Tributos')
@Controller('contabilidad-taxes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadTaxesController {
  constructor(private readonly taxes: ContabilidadTaxesOperationsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen tributario del periodo (IGV y flags agente)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getDashboard(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.taxes.getDashboard(applicationSlug, periodId);
  }

  @Get('igv-summary')
  @ApiOperation({ summary: 'Resumen IGV crédito vs débito del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getIgvSummary(@Query('applicationSlug') applicationSlug?: string, @Query('periodId') periodId?: string) {
    return this.taxes.getIgvSummary(applicationSlug, periodId);
  }

  @Get('pdt621-export')
  @ApiOperation({ summary: 'Datos estructurados PDT 621 del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  exportPdt621(@Query('applicationSlug') applicationSlug?: string, @Query('periodId') periodId?: string) {
    return this.taxes.exportPdt621(applicationSlug, periodId);
  }

  @Get('detraccion-rates')
  @ApiOperation({ summary: 'Tasas SPOT SUNAT configurables' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listDetraccionRates(@Query('applicationSlug') applicationSlug?: string) {
    return this.taxes.listDetraccionRates(applicationSlug);
  }

  @Get('detracciones')
  @ApiOperation({ summary: 'Listar detracciones SPOT' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listDetracciones(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('status') status?: string,
  ) {
    return this.taxes.listDetracciones(applicationSlug, periodId, status);
  }

  @Post('detracciones')
  @ApiOperation({ summary: 'Registrar detracción SPOT con asiento (421 / 4018)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createDetraccion(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateDetraccionInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub ?? undefined;
    return this.taxes.createDetraccion(applicationSlug, body, userId);
  }

  @Post('detracciones/:id/pay')
  @ApiOperation({ summary: 'Pagar detracción vía tesorería' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  payDetraccion(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: PayDetraccionInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub ?? undefined;
    return this.taxes.payDetraccion(applicationSlug, id, body, userId);
  }

  @Get('retentions')
  @ApiOperation({ summary: 'Listar retenciones' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listRetentions(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('retentionType') retentionType?: string,
  ) {
    return this.taxes.listRetentions(applicationSlug, periodId, retentionType);
  }

  @Post('retentions')
  @ApiOperation({ summary: 'Registrar retención con asiento (421 / 4017)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createRetention(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateRetentionInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub ?? undefined;
    return this.taxes.createRetention(applicationSlug, body, userId);
  }

  @Get('perceptions')
  @ApiOperation({ summary: 'Listar percepciones' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listPerceptions(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.taxes.listPerceptions(applicationSlug, periodId);
  }

  @Post('perceptions')
  @ApiOperation({ summary: 'Registrar percepción con cobro tesorería (10xx / 4011)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createPerception(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreatePerceptionInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub ?? undefined;
    return this.taxes.createPerception(applicationSlug, body, userId);
  }
}
