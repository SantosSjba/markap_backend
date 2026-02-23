import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  ContractStatusSummary,
} from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

@Injectable()
export class GetContractStatusSummaryUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
  ): Promise<ContractStatusSummary> {
    return this.reportRepository.getContractStatusSummary(applicationSlug);
  }
}
