import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY, INTERIORISMO_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import {
  INTERIOR_PROJECT_SERIES_KEY,
  type InteriorismoConfigRepository,
  type InteriorismoProjectStageInput,
} from '@domain/repositories/interiorismo-config.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const INTERIORISMO_SLUG = 'interiorismo';

const REQUIRED_STAGE_CODES = new Set([
  'PROSPECT',
  'DESIGN',
  'QUOTE',
  'APPROVED',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
]);

function assertInteriorismoSlug(slug: string | undefined | null): void {
  if (slug?.trim() !== INTERIORISMO_SLUG) {
    throw new BadRequestException(
      'Esta configuración solo aplica a Interiorismo (applicationSlug=interiorismo).',
    );
  }
}

@Injectable()
export class InteriorismoConfigOperationsService {
  constructor(
    @Inject(INTERIORISMO_CONFIG_REPOSITORY)
    private readonly config: InteriorismoConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertInteriorismoSlug(applicationSlug ?? INTERIORISMO_SLUG);
    const app = await this.applicationRepository.findBySlug(INTERIORISMO_SLUG);
    if (!app) throw new EntityNotFoundException('Application', INTERIORISMO_SLUG);
    return app.id;
  }

  private formatNumbering(row: { prefix: string; lastNumber: number } | null) {
    if (!row) {
      return {
        interiorProject: { prefix: 'INT-PRY', lastNumber: 0, nextPreview: 'INT-PRY-0001' },
      };
    }
    const next = row.lastNumber + 1;
    return {
      interiorProject: {
        prefix: row.prefix,
        lastNumber: row.lastNumber,
        nextPreview: `${row.prefix}-${String(next).padStart(4, '0')}`,
      },
    };
  }

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const [projectStages, interiorProjectSeries] = await Promise.all([
      this.config.listProjectStages(applicationId),
      this.config.getNumberingSeries(applicationId, INTERIOR_PROJECT_SERIES_KEY),
    ]);

    return {
      projectStages,
      numbering: this.formatNumbering(interiorProjectSeries),
    };
  }

  async replaceProjectStages(applicationSlug: string | undefined, body: { stages: InteriorismoProjectStageInput[] }) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const stages = body.stages ?? [];
    const codes = new Set(stages.map((s) => s.code));
    if (codes.size !== REQUIRED_STAGE_CODES.size || ![...REQUIRED_STAGE_CODES].every((c) => codes.has(c))) {
      throw new BadRequestException(
        'Debe enviar exactamente las etapas: PROSPECT, DESIGN, QUOTE, APPROVED, IN_PROGRESS, FINISHED, CANCELLED.',
      );
    }
    if (!stages.every((s) => s.label?.trim())) {
      throw new BadRequestException('Cada etapa requiere una etiqueta.');
    }
    if (stages.filter((s) => s.isActive).length < REQUIRED_STAGE_CODES.size) {
      throw new BadRequestException('Las siete etapas deben permanecer activas.');
    }
    await this.config.replaceProjectStages(
      applicationId,
      stages.map((s, idx) => ({
        code: s.code,
        label: s.label.trim(),
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : idx,
        isActive: s.isActive !== false,
      })),
    );
    return this.config.listProjectStages(applicationId);
  }

  async patchInteriorProjectNumbering(
    applicationSlug: string | undefined,
    body: { prefix?: string; lastNumber?: number },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);
    if (body.prefix !== undefined && !body.prefix.trim()) {
      throw new BadRequestException('El prefijo no puede estar vacío.');
    }
    if (body.lastNumber !== undefined && body.lastNumber < 0) {
      throw new BadRequestException('lastNumber no puede ser negativo.');
    }
    if (body.prefix === undefined && body.lastNumber === undefined) {
      throw new BadRequestException('Envíe prefix y/o lastNumber.');
    }
    const updated = await this.config.updateNumberingSeries(applicationId, INTERIOR_PROJECT_SERIES_KEY, {
      ...(body.prefix !== undefined && { prefix: body.prefix }),
      ...(body.lastNumber !== undefined && { lastNumber: body.lastNumber }),
    });
    return this.formatNumbering(updated);
  }
}
