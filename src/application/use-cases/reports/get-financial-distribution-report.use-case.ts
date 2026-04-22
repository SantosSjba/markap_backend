import { Injectable, Inject } from '@nestjs/common';
import { REPORT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ReportRepository, FinancialDistributionReportItem } from '@domain/repositories/report.repository';

@Injectable()
export class GetFinancialDistributionReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialDistributionReportItem[]> {
    return this.reportRepository.getFinancialDistributionReport(applicationSlug, status, startDate, endDate);
  }
}
