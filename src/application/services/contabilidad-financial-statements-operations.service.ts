import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_FINANCIAL_REPOSITORY,
  CONTABILIDAD_REPORTS_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import type { ContabilidadReportsRepository } from '@domain/repositories/contabilidad-reports.repository';
import {
  buildFinancialStatementExcel,
  buildFinancialStatementPdf,
  financialExportFileName,
  type FinancialExportHeader,
  type FinancialExportType,
} from '@domain/utils/contabilidad-financial-export.util';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';
const VALID_EXPORT_TYPES: FinancialExportType[] = [
  'balance-sheet',
  'income-statement',
  'trial-balance',
  'cash-flow',
];

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

  private parseExportType(type?: string): FinancialExportType {
    const exportType = type?.trim() as FinancialExportType;
    if (!exportType || !VALID_EXPORT_TYPES.includes(exportType)) {
      throw new BadRequestException(
        'type debe ser balance-sheet, income-statement, trial-balance o cash-flow.',
      );
    }
    return exportType;
  }

  private async loadExportData(
    applicationId: string,
    periodId: string,
    exportType: FinancialExportType,
    costCenterId?: string | null,
  ) {
    if (exportType === 'balance-sheet') {
      return this.financial.getBalanceSheet(applicationId, periodId);
    }
    if (exportType === 'income-statement') {
      return this.financial.getIncomeStatement(applicationId, periodId);
    }
    if (exportType === 'cash-flow') {
      return this.financial.getCashFlowStatement(applicationId, periodId);
    }
    return this.reports.getTrialBalance(applicationId, periodId, costCenterId?.trim() || null);
  }

  private async resolveExportHeader(applicationId: string): Promise<FinancialExportHeader> {
    const profile = await this.config.getCompanyProfile(applicationId);
    return { ruc: profile.ruc, legalName: profile.legalName };
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
    costCenterId?: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const exportType = this.parseExportType(type);

    try {
      const data = await this.loadExportData(applicationId, id, exportType, costCenterId);
      const buffer = await buildFinancialStatementExcel(exportType, data);
      return { buffer, fileName: financialExportFileName(exportType, id, 'xlsx') };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const message = e instanceof Error ? e.message : 'No se pudo exportar el reporte.';
      throw new BadRequestException(message);
    }
  }

  async exportPdf(
    applicationSlug: string | undefined,
    periodId?: string,
    type?: string,
    costCenterId?: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = this.requirePeriodId(periodId);
    const exportType = this.parseExportType(type);

    try {
      const [data, header] = await Promise.all([
        this.loadExportData(applicationId, id, exportType, costCenterId),
        this.resolveExportHeader(applicationId),
      ]);
      const buffer = await buildFinancialStatementPdf(exportType, data, header);
      return { buffer, fileName: financialExportFileName(exportType, id, 'pdf') };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const message = e instanceof Error ? e.message : 'No se pudo exportar el reporte PDF.';
      throw new BadRequestException(message);
    }
  }
}
