import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  PropertyWithoutContractItem,
} from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

@Injectable()
export class GetPropertiesWithoutContractUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
  ): Promise<PropertyWithoutContractItem[]> {
    return this.reportRepository.getPropertiesWithoutContract(applicationSlug);
  }
}
