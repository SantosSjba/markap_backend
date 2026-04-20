import { Injectable, Inject } from '@nestjs/common';
import type {
  ReportRepository,
  RentalsByMonthItem,
} from '@domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '@domain/repositories/report.repository';

@Injectable()
export class GetRentalsByMonthUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    applicationSlug: string,
    year: number,
    month?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RentalsByMonthItem[]> {
    return this.reportRepository.getRentalsByMonth(applicationSlug, year, month, startDate, endDate);
  }
}
