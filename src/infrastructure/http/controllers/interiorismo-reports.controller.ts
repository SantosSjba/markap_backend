import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetInteriorReportsDashboardUseCase } from '../../../application/use-cases/interior-reports';

@ApiTags('Interiorismo — Reportes')
@Controller('interiorismo-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoReportsController {
  constructor(private readonly dashboardUc: GetInteriorReportsDashboardUseCase) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Dashboard consolidado (ventas/cobranzas, conversión, rentabilidad, productividad, costos, KPIs)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Por defecto interiorismo' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (UTC)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (UTC)' })
  async dashboard(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardUc.execute(applicationSlug, startDate, endDate);
  }
}
