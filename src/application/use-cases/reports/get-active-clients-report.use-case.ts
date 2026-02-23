import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  ActiveClientReportItem,
} from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

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
