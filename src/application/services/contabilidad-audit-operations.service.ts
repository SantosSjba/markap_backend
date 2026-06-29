import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_AUDIT_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_AUDIT_ACTION_LABELS,
  CONTABILIDAD_AUDIT_ENTITY_TYPE_LABELS,
} from '@domain/constants/contabilidad-audit.defaults';
import type {
  ContabilidadAuditRepository,
  CreateContabilidadAuditLogInput,
  ListContabilidadAuditLogsFilters,
} from '@domain/repositories/contabilidad-audit.repository';
import { ContabilidadContextService } from './contabilidad-context.service';

@Injectable()
export class ContabilidadAuditOperationsService {
  constructor(
    private readonly context: ContabilidadContextService,
    @Inject(CONTABILIDAD_AUDIT_REPOSITORY)
    private readonly audit: ContabilidadAuditRepository,
  ) {}

  log(input: CreateContabilidadAuditLogInput) {
    return this.audit.create(input);
  }

  async list(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    filters: ListContabilidadAuditLogsFilters,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const resolvedEntityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const logs = await this.audit.list(applicationId, {
      ...filters,
      legalEntityId: resolvedEntityId,
    });
    return {
      logs,
      actionLabels: CONTABILIDAD_AUDIT_ACTION_LABELS,
      entityTypeLabels: CONTABILIDAD_AUDIT_ENTITY_TYPE_LABELS,
    };
  }
}
