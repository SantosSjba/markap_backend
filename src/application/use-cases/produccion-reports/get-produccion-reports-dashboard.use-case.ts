import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PRODUCCION_REPORTS_REPOSITORY,
  type ProduccionReportsFilters,
  type ProduccionReportsRepository,
} from '@domain/repositories/produccion-reports.repository';

@Injectable()
export class GetProduccionReportsDashboardUseCase {
  constructor(
    @Inject(PRODUCCION_REPORTS_REPOSITORY)
    private readonly reports: ProduccionReportsRepository,
  ) {}

  async execute(
    applicationSlug?: string,
    startDate?: string,
    endDate?: string,
    clientId?: string,
    category?: string,
  ) {
    const slug = applicationSlug?.trim() || 'produccion';
    const filters: ProduccionReportsFilters = {
      applicationSlug: slug,
      startDate: startDate?.trim() ?? '',
      endDate: endDate?.trim() ?? '',
      clientId: clientId?.trim() || undefined,
      category: category?.trim() || undefined,
    };

    const row = await this.reports.getDashboard(filters);
    if (!row) {
      throw new BadRequestException(`No se encontró la aplicación «${slug}».`);
    }
    return row;
  }
}
