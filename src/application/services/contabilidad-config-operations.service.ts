import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY, CONTABILIDAD_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_DOCUMENT_SERIES_KEYS,
  CONTABILIDAD_TAX_REGIMES,
} from '@domain/constants/contabilidad-config.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type {
  ContabilidadCompanyProfileDto,
  ContabilidadConfigRepository,
} from '@domain/repositories/contabilidad-config.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { isValidPeruvianRuc, normalizeRuc } from '@common/utils/ruc-validator';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException(
      'Esta configuración solo aplica a Contabilidad (applicationSlug=contabilidad).',
    );
  }
}

@Injectable()
export class ContabilidadConfigOperationsService {
  constructor(
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

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const [company, settings, documentSeries] = await Promise.all([
      this.config.getCompanyProfile(applicationId),
      this.config.getSettings(applicationId),
      this.config.listDocumentSeries(applicationId),
    ]);

    return { company, settings, documentSeries };
  }

  async updateCompanyProfile(
    applicationSlug: string | undefined,
    body: Partial<ContabilidadCompanyProfileDto>,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);

    if (body.ruc !== undefined) {
      const ruc = normalizeRuc(body.ruc);
      if (ruc && !isValidPeruvianRuc(ruc)) {
        throw new BadRequestException('RUC inválido. Verifique el número y el dígito verificador.');
      }
      body = { ...body, ruc };
    }

    if (body.legalName !== undefined && !body.legalName.trim()) {
      throw new BadRequestException('La razón social es obligatoria.');
    }

    if (body.ubigeoCode !== undefined && body.ubigeoCode && !/^\d{6}$/.test(body.ubigeoCode)) {
      throw new BadRequestException('El ubigeo debe tener 6 dígitos.');
    }

    return this.config.updateCompanyProfile(applicationId, body);
  }

  async updateSettings(
    applicationSlug: string | undefined,
    body: {
      taxRegime?: string;
      isDetractionAgent?: boolean;
      isRetentionAgent?: boolean;
      isPerceptionAgent?: boolean;
      igvPercent?: number;
      currencyCode?: string;
      fiscalYearStartMonth?: number;
      amountDecimals?: number;
    },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);

    if (body.taxRegime !== undefined) {
      const valid = CONTABILIDAD_TAX_REGIMES.some((r) => r.code === body.taxRegime);
      if (!valid) throw new BadRequestException('Régimen tributario no válido.');
    }
    if (body.igvPercent !== undefined && (body.igvPercent < 0 || body.igvPercent > 100)) {
      throw new BadRequestException('IGV debe estar entre 0 y 100.');
    }
    if (body.fiscalYearStartMonth !== undefined && (body.fiscalYearStartMonth < 1 || body.fiscalYearStartMonth > 12)) {
      throw new BadRequestException('Mes de inicio fiscal debe estar entre 1 y 12.');
    }
    if (body.amountDecimals !== undefined && (body.amountDecimals < 0 || body.amountDecimals > 4)) {
      throw new BadRequestException('Decimales debe estar entre 0 y 4.');
    }
    if (body.currencyCode !== undefined && body.currencyCode.trim().length !== 3) {
      throw new BadRequestException('Código de moneda debe tener 3 caracteres (ISO).');
    }

    return this.config.updateSettings(applicationId, body);
  }

  async patchDocumentSeries(
    applicationSlug: string | undefined,
    seriesKey: string,
    body: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const validKeys = Object.values(CONTABILIDAD_DOCUMENT_SERIES_KEYS);
    if (!validKeys.includes(seriesKey as (typeof validKeys)[number])) {
      throw new BadRequestException(`Serie desconocida: ${seriesKey}`);
    }
    if (body.sunatSeries !== undefined && !body.sunatSeries.trim()) {
      throw new BadRequestException('La serie SUNAT no puede estar vacía.');
    }
    if (body.sunatSeries !== undefined && body.sunatSeries.length > 4) {
      throw new BadRequestException('La serie SUNAT admite hasta 4 caracteres.');
    }
    if (body.lastNumber !== undefined && body.lastNumber < 0) {
      throw new BadRequestException('El correlativo no puede ser negativo.');
    }
    if (body.padLength !== undefined && (body.padLength < 1 || body.padLength > 8)) {
      throw new BadRequestException('Longitud del correlativo debe estar entre 1 y 8.');
    }
    if (
      body.sunatSeries === undefined &&
      body.lastNumber === undefined &&
      body.padLength === undefined &&
      body.isActive === undefined
    ) {
      throw new BadRequestException('Envíe al menos un campo a actualizar.');
    }

    return this.config.updateDocumentSeries(applicationId, seriesKey, body);
  }

  async previewDocumentNumber(applicationSlug: string | undefined, seriesKey: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    return { number: await this.config.previewNextDocumentNumber(applicationId, seriesKey) };
  }
}
