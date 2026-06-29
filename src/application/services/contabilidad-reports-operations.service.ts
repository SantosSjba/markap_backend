import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_REPORTS_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadReportsRepository } from '@domain/repositories/contabilidad-reports.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

@Injectable()
export class ContabilidadReportsOperationsService {
  constructor(
    @Inject(CONTABILIDAD_REPORTS_REPOSITORY)
    private readonly reports: ContabilidadReportsRepository,
    @Inject(CONTABILIDAD_CONFIG_REPOSITORY)
    private readonly config: ContabilidadConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  private requirePeriodId(periodId?: string): string {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    return periodId.trim();
  }

  private async resolveIgvPercent(applicationId: string): Promise<number> {
    const settings = await this.config.getSettings(applicationId);
    return settings.igvPercent;
  }

  private mapError(e: unknown, fallback: string): never {
    const message = e instanceof Error ? e.message : fallback;
    throw new BadRequestException(message);
  }

  async getDashboard(applicationSlug: string | undefined, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const igvPercent = await this.resolveIgvPercent(applicationId);
    try {
      return await this.reports.getDashboard(applicationId, id, igvPercent);
    } catch (e) {
      this.mapError(e, 'No se pudo cargar el dashboard.');
    }
  }

  async getTrialBalance(
    applicationSlug: string | undefined,
    periodId?: string,
    costCenterId?: string,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    try {
      return await this.reports.getTrialBalance(applicationId, id, costCenterId?.trim() || null);
    } catch (e) {
      this.mapError(e, 'No se pudo generar el balance de comprobación.');
    }
  }

  async getFinancialAnalysis(applicationSlug: string | undefined, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    try {
      return await this.reports.getFinancialAnalysis(applicationId, id);
    } catch (e) {
      this.mapError(e, 'No se pudo generar el análisis financiero.');
    }
  }

  async getCashFlowTreasury(applicationSlug: string | undefined, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    try {
      return await this.reports.getCashFlowTreasury(applicationId, id);
    } catch (e) {
      this.mapError(e, 'No se pudo generar el flujo de caja.');
    }
  }
}
