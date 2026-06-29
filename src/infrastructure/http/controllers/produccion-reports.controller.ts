import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetProduccionReportsDashboardUseCase } from '../../../application/use-cases/produccion-reports';

@ApiTags('Producción — Reportes')
@Controller('produccion-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionReportsController {
  constructor(private readonly dashboardUc: GetProduccionReportsDashboardUseCase) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard consolidado: producción, ventas, inventario valorizado y rentabilidad',
  })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Por defecto produccion' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (UTC)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (UTC)' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'category', required: false, description: 'Categoría de mueble o material' })
  dashboard(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
    @Query('category') category?: string,
  ) {
    return this.dashboardUc.execute(applicationSlug, startDate, endDate, clientId, category);
  }
}
