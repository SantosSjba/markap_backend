import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  MonthlyMetrics,
} from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

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
