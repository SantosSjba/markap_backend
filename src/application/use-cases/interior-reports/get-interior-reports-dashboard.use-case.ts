import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_REPORTS_REPOSITORY,
  type InteriorReportsRepository,
} from '@domain/repositories/interior-reports.repository';
import type { InteriorReportsDashboardDto } from '@domain/entities/interior-reports.entity';

@Injectable()
export class GetInteriorReportsDashboardUseCase {
  constructor(
    @Inject(INTERIOR_REPORTS_REPOSITORY)
    private readonly reports: InteriorReportsRepository,
  ) {}

  async execute(
    applicationSlug?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<InteriorReportsDashboardDto> {
    const slug = applicationSlug?.trim() || 'interiorismo';
    const row = await this.reports.getDashboard(slug, startDate, endDate);
    if (!row) {
      throw new BadRequestException(`No se encontró la aplicación «${slug}».`);
    }
    return row;
  }
}
