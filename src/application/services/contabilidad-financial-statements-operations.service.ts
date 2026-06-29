import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_FINANCIAL_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

@Injectable()
export class ContabilidadFinancialStatementsOperationsService {
  constructor(
    @Inject(CONTABILIDAD_FINANCIAL_REPOSITORY)
    private readonly financial: ContabilidadFinancialRepository,
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

  async getBalanceSheet(applicationSlug: string | undefined, periodId?: string, comparePrior = true) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const priorPeriodId = comparePrior ? undefined : null;
    try {
      return await this.financial.getBalanceSheet(applicationId, id, priorPeriodId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo generar el balance general.';
      throw new BadRequestException(message);
    }
  }

  async getIncomeStatement(applicationSlug: string | undefined, periodId?: string, comparePrior = true) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const priorPeriodId = comparePrior ? undefined : null;
    try {
      return await this.financial.getIncomeStatement(applicationId, id, priorPeriodId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo generar el estado de resultados.';
      throw new BadRequestException(message);
    }
  }

  async getCashFlowStatement(applicationSlug: string | undefined, periodId?: string, comparePrior = true) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const priorPeriodId = comparePrior ? undefined : null;
    try {
      return await this.financial.getCashFlowStatement(applicationId, id, priorPeriodId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo generar el flujo de efectivo.';
      throw new BadRequestException(message);
    }
  }
}
