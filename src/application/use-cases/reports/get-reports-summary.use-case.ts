import { Injectable, Inject } from '@nestjs/common';
import type { ReportRepository, ReportsSummary } from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

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
