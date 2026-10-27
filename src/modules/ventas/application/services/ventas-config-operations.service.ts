import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import {
  VENTAS_CONFIG_REPOSITORY,
  type VentasConfigRepository,
  type VentasPipelineStageInput,
} from '../../domain/repositories/ventas-config.repository';

const VENTAS_SLUG = 'ventas';

const REQUIRED_PIPELINE_CODES = new Set([
  'SEPARATION',
  'ARRAS',
  'MINUTA',
  'PUBLIC_DEED',
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

  private async resolveApplicationId(
    applicationSlug?: string,
  ): Promise<string> {
    assertVentasSlug(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  async bootstrap(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.config.ensureDefaults(applicationId);
    return {
      pipelineStages: await this.config.listPipelineStages(applicationId),
    };
  }

  async replacePipelineStages(
    applicationSlug: string | undefined,
    body: { stages: VentasPipelineStageInput[] },
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const stages = body.stages ?? [];
    const codes = new Set(stages.map((s) => s.code));
    if (
      codes.size !== REQUIRED_PIPELINE_CODES.size ||
      ![...REQUIRED_PIPELINE_CODES].every((c) => codes.has(c))
    ) {
      throw new BadRequestException(
        'Debe enviar exactamente las etapas: SEPARATION, ARRAS, MINUTA, PUBLIC_DEED.',
      );
    }
    if (!stages.every((s) => s.label?.trim())) {
      throw new BadRequestException('Cada etapa requiere una etiqueta.');
    }
    if (
      stages.filter((s) => s.isActive).length < REQUIRED_PIPELINE_CODES.size
    ) {
      throw new BadRequestException(
        'Las cuatro etapas deben permanecer activas en el pipeline.',
      );
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

  // ── Bancos y medios de pago ──

  async listFinancingChannels(applicationSlug?: string) {
    await this.resolveApplicationId(applicationSlug);
    return this.config.listFinancingChannels();
  }

  async createFinancingChannel(
    applicationSlug: string | undefined,
    body: { category: string; name: string },
  ) {
    await this.resolveApplicationId(applicationSlug);
    const name = body.name.trim();
    const all = await this.config.listFinancingChannels();
    if (
      all.some(
        (c) =>
          c.name.trim().toLocaleLowerCase('es-PE') ===
          name.toLocaleLowerCase('es-PE'),
      )
    ) {
      throw new BadRequestException(`Ya existe «${name}» en el catálogo.`);
    }
    // Código técnico: categoría + nombre sin tildes (BANK_BCP, PAYMENT_METHOD_YAPE…)
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40);
    const base = `${body.category}_${slug || 'CANAL'}`;
    const used = new Set(await this.config.findFinancingChannelCodes(base));
    let code = base;
    for (let n = 2; used.has(code); n++) code = `${base}_${n}`;
    const sortOrder =
      Math.max(
        -1,
        ...all
          .filter((c) => c.category === body.category)
          .map((c) => c.sortOrder),
      ) + 1;
    return this.config.createFinancingChannel({
      category: body.category,
      code,
      name,
      sortOrder,
    });
  }

  async updateFinancingChannel(
    applicationSlug: string | undefined,
    id: string,
    body: {
      category?: string;
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.resolveApplicationId(applicationSlug);
    const name = body.name?.trim();
    if (name) {
      const all = await this.config.listFinancingChannels();
      if (
        all.some(
          (c) =>
            c.id !== id &&
            c.name.trim().toLocaleLowerCase('es-PE') ===
              name.toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new BadRequestException(`Ya existe «${name}» en el catálogo.`);
      }
    }
    const row = await this.config.updateFinancingChannel(id, {
      ...(body.category !== undefined && { category: body.category }),
      ...(name !== undefined && { name }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    });
    if (!row) throw new EntityNotFoundException('SaleFinancingChannel', id);
    return row;
  }
}
