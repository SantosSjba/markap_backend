import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VentasReportsOperationsService } from '../../../application/use-cases/ventas-reports';

@ApiTags('Ventas — Reportes')
@Controller('ventas-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasReportsController {
  constructor(private readonly ventasReports: VentasReportsOperationsService) {}

  @Get('sales-by-period')
  @ApiOperation({ summary: 'Ventas cerradas agrupadas por día / semana / mes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'] })
  async salesByPeriod(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.ventasReports.salesByPeriod(applicationSlug, startDate, endDate, granularity);
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Rendimiento de asesores (cierres, volumen, comisiones del periodo)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async agentPerformance(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ventasReports.agentPerformance(applicationSlug, startDate, endDate);
  }

  @Get('conversion')
  @ApiOperation({
    summary: 'Conversión leads → ventas (procesos creados / ganados, separaciones, cierres, embudo activo)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async conversion(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ventasReports.conversion(applicationSlug, startDate, endDate);
  }

  @Get('financial-flow')
  @ApiOperation({
    summary: 'Flujo financiero del periodo (cobranzas comprador, costos documentación, comisiones)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async financialFlow(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ventasReports.financialFlow(applicationSlug, startDate, endDate);
  }
}
