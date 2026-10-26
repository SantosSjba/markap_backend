import { Inject, Injectable } from '@nestjs/common';
import type { RentalCommissionsList } from '../../../domain/entities/report.entity';
import type {
  ListRentalCommissionsFilters,
  ReportRepository,
} from '../../../domain/repositories/report.repository';
import { REPORT_REPOSITORY } from '../../../domain/repositories/report.repository';

@Injectable()
export class ListRentalCommissionsUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  execute(
    filters: ListRentalCommissionsFilters,
  ): Promise<RentalCommissionsList> {
    return this.reportRepository.listCommissions(filters);
  }
}
