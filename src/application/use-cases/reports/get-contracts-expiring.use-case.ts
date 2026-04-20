import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  ContractExpiringItem,
} from '@domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '@domain/repositories/report.repository';

@Injectable()
export class GetContractsExpiringUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
    days: number,
  ): Promise<ContractExpiringItem[]> {
    return this.reportRepository.getContractsExpiring(applicationSlug, days);
  }
}
