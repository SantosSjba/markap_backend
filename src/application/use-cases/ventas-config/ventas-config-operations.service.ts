import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import {
  VENTAS_CONFIG_REPOSITORY,
  type VentasConfigRepository,
  type VentasPipelineStageDTO,
} from '../../repositories/ventas-config.repository';
import { EntityNotFoundException } from '../../exceptions';

const VENTAS_SLUG = 'ventas';

const REQUIRED_PIPELINE_CODES = new Set([
  'PROSPECT',
  'VISIT',
  'NEGOTIATION',
  'SEPARATION',
  'CLOSING',
]);

function assertVentasSlug(slug: string | undefined | null): void {
  if (slug?.trim() !== VENTAS_SLUG) {
    throw new BadRequestException(
      'Esta configuración solo aplica a Ventas (applicationSlug=ventas).',
    );
  }
}

@Injectable()
export class VentasConfigOperationsService {
  constructor(
    @Inject(VENTAS_CONFIG_REPOSITORY)
    private readonly config: VentasConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertVentasSlug(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  private formatNumbering(row: { prefix: string; lastNumber: number } | null) {
    if (!row) {
      return {
        saleProcess: { prefix: 'VNT-PRC', lastNumber: 0, nextPreview: 'VNT-PRC-0001' },
      };
    }
    const next = row.lastNumber + 1;
    return {
      saleProcess: {
        prefix: row.prefix,
        lastNumber: row.lastNumber,
        nextPreview: `${row.prefix}-${String(next).padStart(4, '0')}`,
      },
    };
  }

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);

    const [pipelineStages, saleProcessSeries, propertyTypes] = await Promise.all([
      this.config.listPipelineStages(applicationId),
      this.config.getNumberingSeries(applicationId, 'SALE_PROCESS'),
      this.config.listActivePropertyTypes(),
    ]);

    return {
      pipelineStages,
      numbering: this.formatNumbering(saleProcessSeries),
      propertyTypes,
    };
  }

  async replacePipelineStages(applicationSlug: string | undefined, body: { stages: VentasPipelineStageDTO[] }) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const stages = body.stages ?? [];
    const codes = new Set(stages.map((s) => s.code));
    if (codes.size !== REQUIRED_PIPELINE_CODES.size || ![...REQUIRED_PIPELINE_CODES].every((c) => codes.has(c))) {
      throw new BadRequestException(
        'Debe enviar exactamente las etapas: PROSPECT, VISIT, NEGOTIATION, SEPARATION, CLOSING.',
      );
    }
    if (!stages.every((s) => s.label?.trim())) {
      throw new BadRequestException('Cada etapa requiere una etiqueta.');
    }
    if (stages.filter((s) => s.isActive).length < REQUIRED_PIPELINE_CODES.size) {
      throw new BadRequestException('Las cinco etapas deben permanecer activas en el pipeline.');
    }
    await this.config.replacePipelineStages(
      applicationId,
      stages.map((s, idx) => ({
        code: s.code,
        label: s.label.trim(),
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : idx,
        isActive: s.isActive !== false,
      })),
    );
    return this.config.listPipelineStages(applicationId);
  }

  async patchNumbering(
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
    const updated = await this.config.updateNumberingSeries(applicationId, 'SALE_PROCESS', {
      ...(body.prefix !== undefined && { prefix: body.prefix }),
      ...(body.lastNumber !== undefined && { lastNumber: body.lastNumber }),
    });
    return this.formatNumbering(updated);
  }
}
