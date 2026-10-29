import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { GetInteriorReportsDashboardUseCase } from '../../application/use-cases/interior-reports/get-interior-reports-dashboard.use-case';

@ApiTags('Interiorismo — Reportes')
@RequiresApplication('interiorismo')
@Controller('interiorismo-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoReportsController {
  constructor(
    private readonly dashboardUc: GetInteriorReportsDashboardUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Dashboard y reportes de proyectos, cobranzas y proveedores por moneda',
  })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Por defecto interiorismo',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'YYYY-MM-DD (hora de Lima)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'YYYY-MM-DD (hora de Lima)',
  })
  async dashboard(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardUc.execute(applicationSlug, startDate, endDate);
  }
}
