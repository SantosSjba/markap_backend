import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetArquitecturaReportsDashboardUseCase } from '../../../application/use-cases/arquitectura-reports';

@ApiTags('Arquitectura — Reportes')
@Controller('arquitectura-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaReportsController {
  constructor(private readonly dashboardUc: GetArquitecturaReportsDashboardUseCase) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Dashboard consolidado (ventas/cobranzas, conversión, rentabilidad, productividad, costos, KPIs)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Por defecto arquitectura' })
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
