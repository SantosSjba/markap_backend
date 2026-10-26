import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { GetActiveClientsReportUseCase } from '../../application/use-cases/reports/get-active-clients-report.use-case';
import { GetContractStatusSummaryUseCase } from '../../application/use-cases/reports/get-contract-status-summary.use-case';
import { GetContractsExpiringUseCase } from '../../application/use-cases/reports/get-contracts-expiring.use-case';
import { GetFinancialDistributionReportUseCase } from '../../application/use-cases/reports/get-financial-distribution-report.use-case';
import { GetMonthlyMetricsUseCase } from '../../application/use-cases/reports/get-monthly-metrics.use-case';
import { GetPropertiesWithoutContractUseCase } from '../../application/use-cases/reports/get-properties-without-contract.use-case';
import { GetRentalsByMonthUseCase } from '../../application/use-cases/reports/get-rentals-by-month.use-case';
import { GetReportsSummaryUseCase } from '../../application/use-cases/reports/get-reports-summary.use-case';

@ApiTags('Reports')
@RequiresApplication('alquileres')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(
    private readonly getReportsSummaryUseCase: GetReportsSummaryUseCase,
    private readonly getContractsExpiringUseCase: GetContractsExpiringUseCase,
    private readonly getPropertiesWithoutContractUseCase: GetPropertiesWithoutContractUseCase,
    private readonly getActiveClientsReportUseCase: GetActiveClientsReportUseCase,
    private readonly getContractStatusSummaryUseCase: GetContractStatusSummaryUseCase,
    private readonly getMonthlyMetricsUseCase: GetMonthlyMetricsUseCase,
    private readonly getRentalsByMonthUseCase: GetRentalsByMonthUseCase,
    private readonly getFinancialDistributionReportUseCase: GetFinancialDistributionReportUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen para tarjetas del dashboard de reportes' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Slug de la aplicación',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Días para contratos por vencer (default: 30)',
  })
  @ApiResponse({ status: 200 })
  async getSummary(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('days') days?: string,
  ) {
    return this.getReportsSummaryUseCase.execute(
      applicationSlug ?? 'alquileres',
      Math.min(365, Math.max(1, parseInt(days ?? '30', 10) || 30)),
    );
  }

  @Get('contracts-expiring')
  @ApiOperation({ summary: 'Contratos que vencen en los próximos N días' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Días (default: 30)',
  })
  @ApiResponse({ status: 200 })
  async getContractsExpiring(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('days') days?: string,
  ) {
    return this.getContractsExpiringUseCase.execute(
      applicationSlug ?? 'alquileres',
      Math.min(365, Math.max(1, parseInt(days ?? '30', 10) || 30)),
    );
  }

  @Get('properties-without-contract')
  @ApiOperation({ summary: 'Propiedades sin contrato activo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getPropertiesWithoutContract(
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getPropertiesWithoutContractUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('active-clients')
  @ApiOperation({
    summary: 'Clientes (inquilinos) con al menos un contrato activo',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getActiveClients(@Query('applicationSlug') applicationSlug?: string) {
    return this.getActiveClientsReportUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('contract-status-summary')
  @ApiOperation({
    summary: 'Resumen por estado: vigentes, por vencer, próximos, urgentes',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getContractStatusSummary(
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getContractStatusSummaryUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('monthly-metrics')
  @ApiOperation({
    summary:
      'Métricas del mes: ocupación, cobranza, renovados, nuevos clientes',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getMonthlyMetrics(@Query('applicationSlug') applicationSlug?: string) {
    return this.getMonthlyMetricsUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('rentals-by-month')
  @ApiOperation({
    summary:
      'Comisiones de alquileres por mes (según la fecha efectiva de cobro), separadas por moneda. Soporta filtro por año, mes específico o rango de fechas.',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({
    name: 'year',
    required: false,
    description:
      'Año (ej: 2026). Requerido salvo que se use startDate/endDate.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Mes específico 1-12 (usar junto con year)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Inicio del rango (YYYY-MM-DD). Reemplaza year/month.',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fin del rango (YYYY-MM-DD). Reemplaza year/month.',
  })
  @ApiResponse({ status: 200 })
  async getRentalsByMonth(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const y =
      parseInt(year ?? String(new Date().getFullYear()), 10) ||
      new Date().getFullYear();
    const m = month ? parseInt(month, 10) || undefined : undefined;
    return this.getRentalsByMonthUseCase.execute(
      applicationSlug ?? 'alquileres',
      y,
      m,
      startDate,
      endDate,
    );
  }

  @Get('financial-distribution')
  @ApiOperation({
    summary:
      'Reporte de distribución financiera por alquiler (ingresos, gastos, impuestos, comisiones y utilidad)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    description: 'Filtrar por estado del contrato',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha inicio del contrato YYYY-MM-DD (cuándo se concretó)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha fin del contrato YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'dateField',
    required: false,
    enum: ['startDate', 'commissionPaidDate'],
    description:
      'Fecha que filtra el rango: inicio del contrato (default) o cobro de la comisión',
  })
  @ApiResponse({ status: 200 })
  async getFinancialDistribution(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dateField') dateField?: string,
  ) {
    return this.getFinancialDistributionReportUseCase.execute(
      applicationSlug ?? 'alquileres',
      status,
      startDate,
      endDate,
      dateField === 'commissionPaidDate' ? 'commissionPaidDate' : 'startDate',
    );
  }
}
