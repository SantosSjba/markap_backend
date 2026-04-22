import { Injectable, Inject } from '@nestjs/common';
import { REPORT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ReportRepository, ContractStatusSummary } from '@domain/repositories/report.repository';

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
