import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  RentalsByMonthItem,
} from '../../repositories/report.repository';
import { REPORT_REPOSITORY } from '../../repositories/report.repository';

@Injectable()
export class GetRentalsByMonthUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
    year: number,
  ): Promise<RentalsByMonthItem[]> {
    return this.reportRepository.getRentalsByMonth(applicationSlug, year);
  }
}
