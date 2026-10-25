import { Inject, Injectable } from '@nestjs/common';
import type { ReportsSummary } from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';

import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

@Injectable()
export class GetReportsSummaryUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
    days: number,
  ): Promise<ReportsSummary> {
    return this.reportRepository.getSummary(applicationSlug, days);
  }
}
