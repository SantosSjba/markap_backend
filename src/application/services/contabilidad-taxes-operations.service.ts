import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
  CONTABILIDAD_TAXES_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_DEFAULT_PERCEPTION_RATE,
  CONTABILIDAD_DEFAULT_RETENTION_RATES,
  CONTABILIDAD_DETRACTION_STATUS_LABELS,
  CONTABILIDAD_PERCEPTION_TYPE_LABELS,
  CONTABILIDAD_RETENTION_TYPE,
  CONTABILIDAD_RETENTION_TYPE_LABELS,
} from '@domain/constants/contabilidad-taxes.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import { CONTABILIDAD_TREASURY_SOURCE_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import type {
  ContabilidadTaxesRepository,
  CreateDetraccionInput,
  CreatePerceptionInput,
  CreateRetentionInput,
  PayDetraccionInput,
} from '@domain/repositories/contabilidad-taxes.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { parsePenAmount } from '@domain/utils/contabilidad-journal-amounts';

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

function assertRuc(ruc: string) {
  const clean = ruc.trim();
  if (!/^\d{11}$/.test(clean)) {
    throw new BadRequestException('RUC debe tener 11 dígitos.');
  }
}

@Injectable()
export class ContabilidadTaxesOperationsService {
  constructor(
    @Inject(CONTABILIDAD_TAXES_REPOSITORY)
    private readonly taxes: ContabilidadTaxesRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
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

  private async assertOpenPeriod(applicationId: string, periodId: string) {
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period) throw new EntityNotFoundException('Period', periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable no está abierto.');
    }
    return period;
  }

  async getDashboard(applicationSlug?: string, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.taxes.ensureDefaults(applicationId);
    const settings = await this.config.getSettings(applicationId);
    if (!periodId) {
      return {
        igvPercent: settings.igvPercent,
        isDetractionAgent: settings.isDetractionAgent,
        isRetentionAgent: settings.isRetentionAgent,
        isPerceptionAgent: settings.isPerceptionAgent,
        summary: null,
      };
    }
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period) throw new EntityNotFoundException('Period', periodId);
    const summary = await this.taxes.getIgvSummary(applicationId, periodId, settings.igvPercent);
    return {
      igvPercent: settings.igvPercent,
      isDetractionAgent: settings.isDetractionAgent,
      isRetentionAgent: settings.isRetentionAgent,
      isPerceptionAgent: settings.isPerceptionAgent,
      summary,
      statusLabels: CONTABILIDAD_DETRACTION_STATUS_LABELS,
      retentionTypeLabels: CONTABILIDAD_RETENTION_TYPE_LABELS,
      perceptionTypeLabels: CONTABILIDAD_PERCEPTION_TYPE_LABELS,
    };
  }

  async getIgvSummary(applicationSlug?: string, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!periodId) throw new BadRequestException('periodId requerido');
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period) throw new EntityNotFoundException('Period', periodId);
    const settings = await this.config.getSettings(applicationId);
    const summary = await this.taxes.getIgvSummary(applicationId, periodId, settings.igvPercent);
    return { summary, igvPercent: settings.igvPercent };
  }

  async exportPdt621(applicationSlug?: string, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!periodId) throw new BadRequestException('periodId requerido');
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period) throw new EntityNotFoundException('Period', periodId);
    const [settings, profile] = await Promise.all([
      this.config.getSettings(applicationId),
      this.config.getCompanyProfile(applicationId),
    ]);
    try {
      return await this.taxes.getPdt621Export(
        applicationId,
        periodId,
        { ruc: profile.ruc, legalName: profile.legalName },
        settings.igvPercent,
      );
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async listDetraccionRates(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const rates = await this.taxes.listDetraccionRates(applicationId);
    return { rates };
  }

  async listDetracciones(applicationSlug?: string, periodId?: string, status?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const detracciones = await this.taxes.listDetracciones(applicationId, { periodId, status });
    return { detracciones, statusLabels: CONTABILIDAD_DETRACTION_STATUS_LABELS };
  }

  async createDetraccion(applicationSlug: string | undefined, body: CreateDetraccionInput, userId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.assertOpenPeriod(applicationId, body.periodId);
    assertRuc(body.supplierRuc);
    if (!body.certificateNumber?.trim()) throw new BadRequestException('Constancia requerida');
    try {
      return await this.taxes.createDetraccion(applicationId, body, userId);
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async payDetraccion(
    applicationSlug: string | undefined,
    id: string,
    body: PayDetraccionInput,
    userId?: string,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.description?.trim()) throw new BadRequestException('Glosa requerida');
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.cashBoxId) {
      throw new BadRequestException('Seleccione caja.');
    }
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.bankAccountId) {
      throw new BadRequestException('Seleccione cuenta bancaria.');
    }
    try {
      return await this.taxes.payDetraccion(applicationId, id, body, userId);
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async listRetentions(applicationSlug?: string, periodId?: string, retentionType?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const retentions = await this.taxes.listRetentions(applicationId, { periodId, retentionType });
    return {
      retentions,
      retentionTypeLabels: CONTABILIDAD_RETENTION_TYPE_LABELS,
      defaultRates: CONTABILIDAD_DEFAULT_RETENTION_RATES,
    };
  }

  async createRetention(applicationSlug: string | undefined, body: CreateRetentionInput, userId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.assertOpenPeriod(applicationId, body.periodId);
    assertRuc(body.counterpartyRuc);
    if (!Object.values(CONTABILIDAD_RETENTION_TYPE).includes(body.retentionType as 'IGV' | 'RENTA')) {
      throw new BadRequestException('Tipo de retención inválido');
    }
    const rate =
      body.ratePercent !== undefined
        ? Number(body.ratePercent)
        : body.retentionType === CONTABILIDAD_RETENTION_TYPE.IGV
          ? CONTABILIDAD_DEFAULT_RETENTION_RATES.IGV
          : CONTABILIDAD_DEFAULT_RETENTION_RATES.RENTA;
    try {
      return await this.taxes.createRetention(
        applicationId,
        { ...body, ratePercent: rate },
        userId,
      );
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async listPerceptions(applicationSlug?: string, periodId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const perceptions = await this.taxes.listPerceptions(applicationId, { periodId });
    return {
      perceptions,
      perceptionTypeLabels: CONTABILIDAD_PERCEPTION_TYPE_LABELS,
      defaultRate: CONTABILIDAD_DEFAULT_PERCEPTION_RATE,
    };
  }

  async createPerception(applicationSlug: string | undefined, body: CreatePerceptionInput, userId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.assertOpenPeriod(applicationId, body.periodId);
    assertRuc(body.customerRuc);
    if (!body.description?.trim()) throw new BadRequestException('Glosa requerida');
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.cashBoxId) {
      throw new BadRequestException('Seleccione caja.');
    }
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.bankAccountId) {
      throw new BadRequestException('Seleccione cuenta bancaria.');
    }
    const rate = body.ratePercent !== undefined ? Number(body.ratePercent) : CONTABILIDAD_DEFAULT_PERCEPTION_RATE;
    if (parsePenAmount(body.taxableBase) <= 0) throw new BadRequestException('Base imponible inválida');
    try {
      return await this.taxes.createPerception(
        applicationId,
        { ...body, ratePercent: rate },
        userId,
      );
    } catch (e) {
      return mapRepoError(e);
    }
  }
}
