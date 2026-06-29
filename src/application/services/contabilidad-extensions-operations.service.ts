import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_EXTENSIONS_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type {
  ContabilidadExtensionsRepository,
  CreateElectronicDocumentLogInput,
  CreateJournalTemplateInput,
  ListElectronicDocumentLogsFilters,
  ListExchangeRatesFilters,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
  UpsertIncomeTaxPeriodInput,
} from '@domain/repositories/contabilidad-extensions.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

function mapRepoError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Operación no válida.';
  throw new BadRequestException(message);
}

@Injectable()
export class ContabilidadExtensionsOperationsService {
  constructor(
    @Inject(CONTABILIDAD_EXTENSIONS_REPOSITORY)
    private readonly extensions: ContabilidadExtensionsRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  async listExchangeRates(applicationSlug: string | undefined, filters: ListExchangeRatesFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const rates = await this.extensions.listExchangeRates(applicationId, filters);
    return { rates };
  }

  async upsertExchangeRate(applicationSlug: string | undefined, body: UpsertExchangeRateInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.rateDate?.trim() || !body.currencyCode?.trim()) {
      throw new BadRequestException('Fecha y moneda son obligatorias.');
    }
    try {
      return await this.extensions.upsertExchangeRate(applicationId, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listJournalTemplates(applicationSlug: string | undefined) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const templates = await this.extensions.listJournalTemplates(applicationId);
    return { templates };
  }

  async getJournalTemplate(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const template = await this.extensions.findJournalTemplateById(applicationId, id);
    if (!template) throw new EntityNotFoundException('ContabilidadJournalTemplate', id);
    return template;
  }

  async createJournalTemplate(applicationSlug: string | undefined, body: CreateJournalTemplateInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.name?.trim()) throw new BadRequestException('Nombre de plantilla obligatorio.');
    if (!body.lines?.length) throw new BadRequestException('La plantilla debe tener al menos una línea.');
    try {
      return await this.extensions.createJournalTemplate(applicationId, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async updateJournalTemplate(
    applicationSlug: string | undefined,
    id: string,
    body: UpdateJournalTemplateInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.extensions.findJournalTemplateById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalTemplate', id);
    try {
      return await this.extensions.updateJournalTemplate(applicationId, id, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async deleteJournalTemplate(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.extensions.findJournalTemplateById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalTemplate', id);
    try {
      await this.extensions.deleteJournalTemplate(applicationId, id);
      return { deleted: true };
    } catch (error) {
      mapRepoError(error);
    }
  }

  async applyJournalTemplate(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.extensions.applyJournalTemplate(applicationId, id);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async generateInventorySnapshot(applicationSlug: string | undefined, periodId: string) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.periods.findPeriodById(applicationId, periodId.trim());
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    try {
      const snapshots = await this.extensions.generateInventorySnapshot(applicationId, periodId.trim());
      return { snapshots };
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listInventorySnapshots(applicationSlug: string | undefined, periodId: string) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const snapshots = await this.extensions.listInventorySnapshots(applicationId, periodId.trim());
    return { snapshots };
  }

  async listElectronicDocumentLogs(
    applicationSlug: string | undefined,
    filters: ListElectronicDocumentLogsFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const logs = await this.extensions.listElectronicDocumentLogs(applicationId, filters);
    return { logs };
  }

  async createElectronicDocumentLog(
    applicationSlug: string | undefined,
    body: CreateElectronicDocumentLogInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.documentKind?.trim() || !body.documentRef?.trim()) {
      throw new BadRequestException('Tipo y referencia de documento son obligatorios.');
    }
    if (body.periodId) {
      const period = await this.periods.findPeriodById(applicationId, body.periodId);
      if (!period) throw new EntityNotFoundException('ContabilidadPeriod', body.periodId);
    }
    try {
      return await this.extensions.createElectronicDocumentLog(applicationId, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async getIncomeTaxSummary(applicationSlug: string | undefined, periodId: string) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.periods.findPeriodById(applicationId, periodId.trim());
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    try {
      return await this.extensions.getIncomeTaxSummary(applicationId, periodId.trim());
    } catch (error) {
      mapRepoError(error);
    }
  }

  async getIncomeTaxDetail(applicationSlug: string | undefined, periodId: string) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.periods.findPeriodById(applicationId, periodId.trim());
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    try {
      return await this.extensions.getIncomeTaxDetail(applicationId, periodId.trim());
    } catch (error) {
      mapRepoError(error);
    }
  }

  async upsertIncomeTaxPeriod(
    applicationSlug: string | undefined,
    periodId: string,
    body: UpsertIncomeTaxPeriodInput,
  ) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.periods.findPeriodById(applicationId, periodId.trim());
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    if (period.status !== 'OPEN') {
      throw new BadRequestException('El periodo contable está cerrado.');
    }
    try {
      return await this.extensions.upsertIncomeTaxPeriodSummary(applicationId, periodId.trim(), body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async exportIncomeTaxDraft(applicationSlug: string | undefined, periodId: string) {
    if (!periodId?.trim()) throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.periods.findPeriodById(applicationId, periodId.trim());
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    try {
      return await this.extensions.exportIncomeTaxDraft(applicationId, periodId.trim());
    } catch (error) {
      mapRepoError(error);
    }
  }
}
