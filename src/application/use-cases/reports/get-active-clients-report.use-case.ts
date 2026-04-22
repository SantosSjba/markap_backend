import { Injectable, Inject } from '@nestjs/common';
import { REPORT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ReportRepository, ActiveClientReportItem } from '@domain/repositories/report.repository';

@Injectable()
export class GetActiveClientsReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
  ): Promise<ActiveClientReportItem[]> {
    return this.reportRepository.getActiveClients(applicationSlug);
  }
}
