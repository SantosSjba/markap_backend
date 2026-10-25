import { Inject, Injectable } from '@nestjs/common';
import type { ActiveClientReportItem } from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

@Injectable()
export class GetActiveClientsReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(applicationSlug: string): Promise<ActiveClientReportItem[]> {
    return this.reportRepository.getActiveClients(applicationSlug);
  }
}
