import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_LEGAL_ENTITY_REPOSITORY } from '@common/constants/injection-tokens';
import type { ContabilidadLegalEntityRepository } from '@domain/repositories/contabilidad-legal-entity.repository';
import { ContabilidadContextService } from './contabilidad-context.service';

@Injectable()
export class ContabilidadLegalEntityOperationsService {
  constructor(
    private readonly context: ContabilidadContextService,
    @Inject(CONTABILIDAD_LEGAL_ENTITY_REPOSITORY)
    private readonly legalEntities: ContabilidadLegalEntityRepository,
  ) {}

  async list(applicationSlug?: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    await this.legalEntities.ensureDefaults(applicationId);
    const entities = await this.legalEntities.list(applicationId);
    return { entities };
  }
}
