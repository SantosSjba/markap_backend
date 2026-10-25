import { Inject, Injectable } from '@nestjs/common';
import type { ContractExpiringItem } from '../../../domain/entities/report.entity';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

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
