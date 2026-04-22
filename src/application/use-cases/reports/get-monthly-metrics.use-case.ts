import { Injectable, Inject } from '@nestjs/common';
import { REPORT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ReportRepository, MonthlyMetrics } from '@domain/repositories/report.repository';

@Injectable()
export class GetMonthlyMetricsUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(applicationSlug: string): Promise<MonthlyMetrics> {
    return this.reportRepository.getMonthlyMetrics(applicationSlug);
  }
}
