import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  GetReportsSummaryUseCase,
  GetContractsExpiringUseCase,
  GetPropertiesWithoutContractUseCase,
  GetActiveClientsReportUseCase,
  GetContractStatusSummaryUseCase,
  GetMonthlyMetricsUseCase,
  GetRentalsByMonthUseCase,
} from '../../../application/use-cases/reports';

@ApiTags('Reports')
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
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen para tarjetas del dashboard de reportes' })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Slug de la aplicación' })
  @ApiQuery({ name: 'days', required: false, description: 'Días para contratos por vencer (default: 30)' })
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
  @ApiQuery({ name: 'days', required: false, description: 'Días (default: 30)' })
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
  @ApiOperation({ summary: 'Clientes (inquilinos) con al menos un contrato activo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getActiveClients(
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getActiveClientsReportUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('contract-status-summary')
  @ApiOperation({ summary: 'Resumen por estado: vigentes, por vencer, próximos, urgentes' })
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
  @ApiOperation({ summary: 'Métricas del mes: ocupación, cobranza, renovados, nuevos clientes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async getMonthlyMetrics(
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getMonthlyMetricsUseCase.execute(
      applicationSlug ?? 'alquileres',
    );
  }

  @Get('rentals-by-month')
  @ApiOperation({ summary: 'Reporte de alquiler por mes del año' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'year', required: true, description: 'Año (ej: 2025)' })
  @ApiResponse({ status: 200 })
  async getRentalsByMonth(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('year') year?: string,
  ) {
    const y = parseInt(year ?? String(new Date().getFullYear()), 10) || new Date().getFullYear();
    return this.getRentalsByMonthUseCase.execute(
      applicationSlug ?? 'alquileres',
      y,
    );
  }
}
