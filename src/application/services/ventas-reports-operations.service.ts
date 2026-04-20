import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '@domain/repositories/application.repository';
import {
  VENTAS_REPORTS_REPOSITORY,
  type VentasReportsRepository,
  VENTAS_REPORTS_GRANULARITY,
  type VentasReportsGranularity,
} from '@domain/repositories/ventas-reports.repository';
import { EntityNotFoundException } from '@domain/exceptions';

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
  const end = endDate?.trim()
    ? new Date(endDate.trim())
    : new Date();
  if (Number.isNaN(end.getTime())) {
    throw new BadRequestException('endDate inválida. Use YYYY-MM-DD.');
  }
  end.setHours(23, 59, 59, 999);

  const start = startDate?.trim()
    ? new Date(startDate.trim())
    : (() => {
        const s = new Date(end);
        s.setDate(s.getDate() - 89);
        return s;
      })();
  if (Number.isNaN(start.getTime())) {
    throw new BadRequestException('startDate inválida. Use YYYY-MM-DD.');
  }
  start.setHours(0, 0, 0, 0);

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
