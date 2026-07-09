import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ARQUITECTURA_REPORTS_REPOSITORY,
  type ArquitecturaReportsRepository,
} from '@domain/repositories/arquitectura-reports.repository';
import type { ArquitecturaReportsDashboardDto } from '@domain/entities/arquitectura-reports.entity';

@Injectable()
export class GetArquitecturaReportsDashboardUseCase {
  constructor(
    @Inject(ARQUITECTURA_REPORTS_REPOSITORY)
    private readonly reports: ArquitecturaReportsRepository,
  ) {}

  async execute(
    applicationSlug?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ArquitecturaReportsDashboardDto> {
    const slug = applicationSlug?.trim() || 'arquitectura';
    const row = await this.reports.getDashboard(slug, startDate, endDate);
    if (!row) {
      throw new BadRequestException(`No se encontró la aplicación «${slug}».`);
    }
    return row;
  }
}
