import { Injectable, Inject } from '@nestjs/common';
import type { ReportRepository, ReportsSummary } from '@domain/repositories/report.repository';

import { REPORT_REPOSITORY } from '@common/constants/injection-tokens';

@Injectable()
export class GetReportsSummaryUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(applicationSlug: string, days: number): Promise<ReportsSummary> {
    return this.reportRepository.getSummary(applicationSlug, days);
  }
}
