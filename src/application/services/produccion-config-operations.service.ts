import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY, PRODUCCION_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_DEFAULT_PRODUCTION_STAGES,
  PRODUCCION_DEFAULT_STAGE_KEY_SET,
  PRODUCCION_NUMBERING_SERIES_KEYS,
} from '@domain/constants/produccion-config.defaults';
import type {
  ProduccionConfigRepository,
  ProduccionFurnitureCategoryInput,
  ProduccionMaterialCategoryInput,
  ProduccionProductionStageInput,
  ProduccionUnitInput,
} from '@domain/repositories/produccion-config.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const PRODUCCION_SLUG = 'produccion';

function assertProduccionSlug(slug: string | undefined | null) {
  if (slug?.trim() !== PRODUCCION_SLUG) {
    throw new BadRequestException('Esta configuración solo aplica a Producción (applicationSlug=produccion).');
  }
}

@Injectable()
export class ProduccionConfigOperationsService {
  constructor(
    @Inject(PRODUCCION_CONFIG_REPOSITORY)
    private readonly config: ProduccionConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertProduccionSlug(applicationSlug ?? PRODUCCION_SLUG);
    const app = await this.applications.findBySlug(PRODUCCION_SLUG);
    if (!app) throw new EntityNotFoundException('Application', PRODUCCION_SLUG);
    return app.id;
  }

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const [settings, furnitureCategories, materialCategories, productionStages, units, numbering] =
      await Promise.all([
      this.config.getSettings(applicationId),
      this.config.listFurnitureCategories(applicationId),
      this.config.listMaterialCategories(applicationId),
      this.config.listProductionStages(applicationId),
      this.config.listUnits(applicationId),
      this.config.listNumberingSeries(applicationId),
    ]);

    return { settings, furnitureCategories, materialCategories, productionStages, units, numbering };
  }

  async updateSettings(
    applicationSlug: string | undefined,
    body: { igvPercent?: number; woodWastePercent?: number; quotationValidDays?: number },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (body.igvPercent !== undefined && (body.igvPercent < 0 || body.igvPercent > 100)) {
      throw new BadRequestException('IGV debe estar entre 0 y 100.');
    }
    if (body.woodWastePercent !== undefined && (body.woodWastePercent < 0 || body.woodWastePercent > 100)) {
      throw new BadRequestException('% desperdicio debe estar entre 0 y 100.');
    }
    if (body.quotationValidDays !== undefined && body.quotationValidDays < 1) {
      throw new BadRequestException('Vigencia de cotización debe ser al menos 1 día.');
    }
    return this.config.updateSettings(applicationId, body);
  }

  async replaceFurnitureCategories(
    applicationSlug: string | undefined,
    body: { categories: ProduccionFurnitureCategoryInput[] },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const categories = body.categories ?? [];
    if (!categories.length) throw new BadRequestException('Debe incluir al menos una categoría.');
    if (!categories.every((c) => c.code?.trim() && c.label?.trim())) {
      throw new BadRequestException('Cada categoría requiere código y etiqueta.');
    }
    await this.config.replaceFurnitureCategories(
      applicationId,
      categories.map((c, i) => ({
        code: c.code.trim(),
        label: c.label.trim(),
        sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : i,
        isActive: c.isActive !== false,
      })),
    );
    return this.config.listFurnitureCategories(applicationId);
  }

  async replaceMaterialCategories(
    applicationSlug: string | undefined,
    body: { categories: ProduccionMaterialCategoryInput[] },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const categories = body.categories ?? [];
    if (!categories.length) throw new BadRequestException('Debe incluir al menos una categoría.');
    if (!categories.every((c) => c.code?.trim() && c.label?.trim())) {
      throw new BadRequestException('Cada categoría requiere código y etiqueta.');
    }
    await this.config.replaceMaterialCategories(
      applicationId,
      categories.map((c, i) => ({
        code: c.code.trim(),
        label: c.label.trim(),
        sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : i,
        isActive: c.isActive !== false,
      })),
    );
    return this.config.listMaterialCategories(applicationId);
  }

  async replaceProductionStages(
    applicationSlug: string | undefined,
    body: { stages: ProduccionProductionStageInput[] },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const stages = body.stages ?? [];
    const keys = new Set(stages.map((s) => s.stageKey));
    if (
      keys.size !== PRODUCCION_DEFAULT_STAGE_KEY_SET.size ||
      ![...PRODUCCION_DEFAULT_STAGE_KEY_SET].every((k) => keys.has(k))
    ) {
      throw new BadRequestException(
        `Debe incluir exactamente las etapas: ${[...PRODUCCION_DEFAULT_STAGE_KEY_SET].join(', ')}.`,
      );
    }
    if (!stages.every((s) => s.label?.trim())) {
      throw new BadRequestException('Cada etapa requiere una etiqueta.');
    }
    if (stages.filter((s) => s.isActive !== false).length < PRODUCCION_DEFAULT_PRODUCTION_STAGES.length) {
      throw new BadRequestException('Las cuatro etapas deben permanecer activas.');
    }
    await this.config.replaceProductionStages(
      applicationId,
      stages.map((s, i) => ({
        stageKey: s.stageKey,
        label: s.label.trim(),
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : i,
        isActive: s.isActive !== false,
      })),
    );
    return this.config.listProductionStages(applicationId);
  }

  async replaceUnits(applicationSlug: string | undefined, body: { units: ProduccionUnitInput[] }) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const units = body.units ?? [];
    if (!units.length) throw new BadRequestException('Debe incluir al menos una unidad.');
    if (!units.every((u) => u.code?.trim() && u.label?.trim())) {
      throw new BadRequestException('Cada unidad requiere código y etiqueta.');
    }
    await this.config.replaceUnits(
      applicationId,
      units.map((u, i) => ({
        code: u.code.trim(),
        label: u.label.trim(),
        sortOrder: typeof u.sortOrder === 'number' ? u.sortOrder : i,
        isActive: u.isActive !== false,
      })),
    );
    return this.config.listUnits(applicationId);
  }

  async patchNumbering(
    applicationSlug: string | undefined,
    seriesKey: string,
    body: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const validKeys = Object.values(PRODUCCION_NUMBERING_SERIES_KEYS);
    if (!validKeys.includes(seriesKey as (typeof validKeys)[number])) {
      throw new BadRequestException(`Serie desconocida: ${seriesKey}`);
    }
    if (body.prefix !== undefined && !body.prefix.trim()) {
      throw new BadRequestException('El prefijo no puede estar vacío.');
    }
    if (body.lastNumber !== undefined && body.lastNumber < 0) {
      throw new BadRequestException('lastNumber no puede ser negativo.');
    }
    if (body.padLength !== undefined && (body.padLength < 1 || body.padLength > 8)) {
      throw new BadRequestException('padLength debe estar entre 1 y 8.');
    }
    if (
      body.prefix === undefined &&
      body.lastNumber === undefined &&
      body.padLength === undefined &&
      body.includeYear === undefined
    ) {
      throw new BadRequestException('Envíe al menos un campo a actualizar.');
    }

    return this.config.updateNumberingSeries(applicationId, seriesKey, body);
  }

  async previewCode(applicationSlug: string | undefined, seriesKey: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    return { code: await this.config.previewNextCode(applicationId, seriesKey) };
  }
}
