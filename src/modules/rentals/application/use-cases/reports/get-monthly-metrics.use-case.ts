import { Inject, Injectable } from '@nestjs/common';
import type { MonthlyMetrics } from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

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
