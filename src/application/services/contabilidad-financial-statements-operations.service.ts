import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_FINANCIAL_REPOSITORY,
  CONTABILIDAD_REPORTS_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import type { ContabilidadReportsRepository } from '@domain/repositories/contabilidad-reports.repository';
import {
  buildFinancialStatementExcel,
  financialExportFileName,
  type FinancialExportType,
} from '@domain/utils/contabilidad-financial-export.util';
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
    @Inject(CONTABILIDAD_REPORTS_REPOSITORY)
    private readonly reports: ContabilidadReportsRepository,
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

  async exportExcel(
    applicationSlug: string | undefined,
    periodId?: string,
    type?: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const exportType = type?.trim() as FinancialExportType;

    if (!exportType || !['balance-sheet', 'income-statement', 'trial-balance'].includes(exportType)) {
      throw new BadRequestException(
        'type debe ser balance-sheet, income-statement o trial-balance.',
      );
    }

    try {
      let data;
      if (exportType === 'balance-sheet') {
        data = await this.financial.getBalanceSheet(applicationId, id);
      } else if (exportType === 'income-statement') {
        data = await this.financial.getIncomeStatement(applicationId, id);
      } else {
        data = await this.reports.getTrialBalance(applicationId, id);
      }

      const buffer = await buildFinancialStatementExcel(exportType, data);
      return { buffer, fileName: financialExportFileName(exportType, id) };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo exportar el reporte.';
      throw new BadRequestException(message);
    }
  }
}
