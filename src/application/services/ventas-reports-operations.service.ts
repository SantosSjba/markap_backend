import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY, VENTAS_REPORTS_REPOSITORY } from '@common/constants/injection-tokens';
import {
  type VentasReportsRepository,
  VENTAS_REPORTS_GRANULARITY,
  type VentasReportsGranularity,
} from '@domain/repositories/ventas-reports.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { formatDateOnly, parseDateOnly, todayDateOnlyLima } from '@domain/utils/peru-date.util';

const VENTAS_SLUG = 'ventas';

function assertVentasSlug(slug: string | undefined | null): void {
  if (slug?.trim() !== VENTAS_SLUG) {
    throw new BadRequestException(
      'Estos reportes solo aplican a Ventas (applicationSlug=ventas).',
    );
  }
}

function isGranularity(v: string): v is VentasReportsGranularity {
  return (VENTAS_REPORTS_GRANULARITY as readonly string[]).includes(v);
}

function parseRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
  let end: Date;
  if (endDate?.trim()) {
    try {
      end = parseDateOnly(endDate.trim());
    } catch {
      throw new BadRequestException('endDate inválida. Use YYYY-MM-DD.');
    }
    end.setUTCHours(23, 59, 59, 999);
  } else {
    end = new Date();
  }

  let start: Date;
  if (startDate?.trim()) {
    try {
      start = parseDateOnly(startDate.trim());
    } catch {
      throw new BadRequestException('startDate inválida. Use YYYY-MM-DD.');
    }
    start.setUTCHours(0, 0, 0, 0);
  } else {
    const endYmd = endDate?.trim() || todayDateOnlyLima();
    start = parseDateOnly(endYmd);
    start.setUTCDate(start.getUTCDate() - 89);
    start.setUTCHours(0, 0, 0, 0);
  }

  if (start.getTime() > end.getTime()) {
    throw new BadRequestException('startDate no puede ser posterior a endDate.');
  }

  return { start, end };
}

@Injectable()
export class VentasReportsOperationsService {
  constructor(
    @Inject(VENTAS_REPORTS_REPOSITORY)
    private readonly reports: VentasReportsRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertVentasSlug(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  async salesByPeriod(
    applicationSlug: string | undefined,
    startDate?: string,
    endDate?: string,
    granularity?: string,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const { start, end } = parseRange(startDate, endDate);
    const g: VentasReportsGranularity = granularity && isGranularity(granularity) ? granularity : 'month';
    return this.reports.getSalesByPeriod(
      { applicationId, startDate: start, endDate: end },
      g,
    );
  }

  async agentPerformance(
    applicationSlug: string | undefined,
    startDate?: string,
    endDate?: string,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const { start, end } = parseRange(startDate, endDate);
    return this.reports.getAgentPerformance({
      applicationId,
      startDate: start,
      endDate: end,
    });
  }

  async conversion(applicationSlug: string | undefined, startDate?: string, endDate?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const { start, end } = parseRange(startDate, endDate);
    return this.reports.getConversion({
      applicationId,
      startDate: start,
      endDate: end,
    });
  }

  async financialFlow(applicationSlug: string | undefined, startDate?: string, endDate?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const { start, end } = parseRange(startDate, endDate);
    return this.reports.getFinancialFlow({
      applicationId,
      startDate: start,
      endDate: end,
    });
  }
}
