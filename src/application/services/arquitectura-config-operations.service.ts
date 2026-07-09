import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY, ARQUITECTURA_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import {
  ARQUITECTURA_PROJECT_SERIES_KEY,
  type ArquitecturaConfigRepository,
  type ArquitecturaProjectStageInput,
} from '@domain/repositories/arquitectura-config.repository';
import {
  ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET,
  ARQUITECTURA_PROJECT_LIFECYCLE_STAGES,
} from '@domain/constants/arquitectura-project-stages.constants';
import { EntityNotFoundException } from '@domain/exceptions';

const ARQUITECTURA_SLUG = 'arquitectura';

function assertArquitecturaSlug(slug: string | undefined | null): void {
  if (slug?.trim() !== ARQUITECTURA_SLUG) {
    throw new BadRequestException(
      'Esta configuración solo aplica a Arquitectura (applicationSlug=arquitectura).',
    );
  }
}

@Injectable()
export class ArquitecturaConfigOperationsService {
  constructor(
    @Inject(ARQUITECTURA_CONFIG_REPOSITORY)
    private readonly config: ArquitecturaConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertArquitecturaSlug(applicationSlug ?? ARQUITECTURA_SLUG);
    const app = await this.applicationRepository.findBySlug(ARQUITECTURA_SLUG);
    if (!app) throw new EntityNotFoundException('Application', ARQUITECTURA_SLUG);
    return app.id;
  }

  private formatNumbering(row: { prefix: string; lastNumber: number } | null) {
    if (!row) {
      return {
        arquitecturaProject: { prefix: 'ARQ-PRY', lastNumber: 0, nextPreview: 'ARQ-PRY-0001' },
      };
    }
    const next = row.lastNumber + 1;
    return {
      arquitecturaProject: {
        prefix: row.prefix,
        lastNumber: row.lastNumber,
        nextPreview: `${row.prefix}-${String(next).padStart(4, '0')}`,
      },
    };
  }

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const [projectStages, arquitecturaProjectSeries] = await Promise.all([
      this.config.listProjectStages(applicationId),
      this.config.getNumberingSeries(applicationId, ARQUITECTURA_PROJECT_SERIES_KEY),
    ]);

    return {
      projectStages,
      numbering: this.formatNumbering(arquitecturaProjectSeries),
    };
  }

  async replaceProjectStages(applicationSlug: string | undefined, body: { stages: ArquitecturaProjectStageInput[] }) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const stages = body.stages ?? [];
    const codes = new Set(stages.map((s) => s.code));
    if (
      codes.size !== ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET.size ||
      ![...ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET].every((c) => codes.has(c))
    ) {
      throw new BadRequestException(
        'Debe enviar exactamente las etapas: DESIGN, QUOTE, APPROVED, IN_PROGRESS, FINISHED.',
      );
    }
    if (!stages.every((s) => s.label?.trim())) {
      throw new BadRequestException('Cada etapa requiere una etiqueta.');
    }
    if (stages.filter((s) => s.isActive).length < ARQUITECTURA_PROJECT_LIFECYCLE_STAGES.length) {
      throw new BadRequestException('Las cinco etapas deben permanecer activas.');
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

  async patchArquitecturaProjectNumbering(
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
    const updated = await this.config.updateNumberingSeries(applicationId, ARQUITECTURA_PROJECT_SERIES_KEY, {
      ...(body.prefix !== undefined && { prefix: body.prefix }),
      ...(body.lastNumber !== undefined && { lastNumber: body.lastNumber }),
    });
    return this.formatNumbering(updated);
  }
}
