import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  formatDateOnly,
  parseDateOnly,
  todayDateOnlyLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import type { InteriorReportsDashboardDto } from '../../../domain/entities/interior-reports.entity';
import {
  INTERIOR_REPORTS_REPOSITORY,
  type InteriorReportsRepository,
} from '../../../domain/repositories/interior-reports.repository';

const MAX_RANGE_YEARS = 30;

@Injectable()
export class GetInteriorReportsDashboardUseCase {
  constructor(
    @Inject(INTERIOR_REPORTS_REPOSITORY)
    private readonly reports: InteriorReportsRepository,
  ) {}

  async execute(
    applicationSlug?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<InteriorReportsDashboardDto> {
    const slug = applicationSlug?.trim() || 'interiorismo';
    const today = todayDateOnlyLima();
    const fallback = parseDateOnly(today);
    fallback.setUTCDate(fallback.getUTCDate() - 89);
    startDate = startDate ?? formatDateOnly(fallback);
    endDate = endDate ?? today;
    for (const value of [startDate, endDate]) {
      if (value === undefined) continue;
      const date = new Date(`${value}T12:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(
          'Usa fechas válidas con formato AAAA-MM-DD.',
        );
      }
    }
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Desde debe ser anterior o igual a Hasta.');
    }
    // «Todo» en Reportes parte del 2000: la serie mensual sigue siendo pequeña (~12 por año)
    if (
      startDate &&
      endDate &&
      new Date(endDate).getTime() - new Date(startDate).getTime() >
        366 * MAX_RANGE_YEARS * 86400000
    ) {
      throw new BadRequestException(
        `El rango máximo es de ${MAX_RANGE_YEARS} años.`,
      );
    }
    const row = await this.reports.getDashboard(slug, startDate, endDate);
    if (!row) {
      throw new BadRequestException(`No se encontró la aplicación «${slug}».`);
    }
    return row;
  }
}
