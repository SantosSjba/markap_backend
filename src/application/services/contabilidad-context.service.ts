import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY, CONTABILIDAD_LEGAL_ENTITY_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadLegalEntityRepository } from '@domain/repositories/contabilidad-legal-entity.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

@Injectable()
export class ContabilidadContextService {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    @Inject(CONTABILIDAD_LEGAL_ENTITY_REPOSITORY)
    private readonly legalEntities: ContabilidadLegalEntityRepository,
  ) {}

  assertContabilidadSlug(applicationSlug?: string | null) {
    if (applicationSlug?.trim() !== CONTABILIDAD_SLUG) {
      throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
    }
  }

  async resolveApplicationId(applicationSlug?: string): Promise<string> {
    this.assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  async resolveLegalEntityId(applicationId: string, legalEntityId?: string): Promise<string> {
    await this.legalEntities.ensureDefaults(applicationId);

    if (legalEntityId?.trim()) {
      const entity = await this.legalEntities.findById(applicationId, legalEntityId.trim());
      if (!entity) throw new EntityNotFoundException('ContabilidadLegalEntity', legalEntityId);
      return entity.id;
    }

    const defaultEntity = await this.legalEntities.getDefault(applicationId);
    if (!defaultEntity) {
      throw new BadRequestException('No hay entidad legal configurada para Contabilidad.');
    }
    return defaultEntity.id;
  }
}
