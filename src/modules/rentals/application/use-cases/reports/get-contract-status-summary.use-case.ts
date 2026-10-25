import { Inject, Injectable } from '@nestjs/common';
import type { ContractStatusSummary } from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

@Injectable()
export class GetContractStatusSummaryUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(applicationSlug: string): Promise<ContractStatusSummary> {
    return this.reportRepository.getContractStatusSummary(applicationSlug);
  }
}
