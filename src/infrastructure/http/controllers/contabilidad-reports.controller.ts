import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadReportsOperationsService } from '../../../application/services/contabilidad-reports-operations.service';

@ApiTags('Contabilidad — Reportes')
@Controller('contabilidad-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadReportsController {
  constructor(private readonly reports: ContabilidadReportsOperationsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs del periodo para dashboard' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  getDashboard(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.reports.getDashboard(applicationSlug, periodId);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Balance de comprobación del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  @ApiQuery({ name: 'costCenterId', required: false })
  getTrialBalance(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('costCenterId') costCenterId?: string,
  ) {
    return this.reports.getTrialBalance(applicationSlug, periodId, costCenterId);
  }

  @Get('financial-analysis')
  @ApiOperation({ summary: 'Ratios y análisis financiero' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  getFinancialAnalysis(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.reports.getFinancialAnalysis(applicationSlug, periodId);
  }

  @Get('cash-flow-treasury')
  @ApiOperation({ summary: 'Flujo de caja desde tesorería (método directo)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  getCashFlowTreasury(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.reports.getCashFlowTreasury(applicationSlug, periodId);
  }
}
