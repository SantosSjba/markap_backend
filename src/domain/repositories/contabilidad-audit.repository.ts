export const CONTABILIDAD_AUDIT_REPOSITORY = Symbol('ContabilidadAuditRepository');

export interface CreateContabilidadAuditLogInput {
  applicationId: string;
  legalEntityId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  userId?: string | null;
  summary?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface ListContabilidadAuditLogsFilters {
  legalEntityId?: string;
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface ContabilidadAuditLogDto {
  id: string;
  legalEntityId: string | null;
  legalEntityCode: string | null;
  legalEntityRuc: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  userId: string | null;
  summary: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface ContabilidadAuditRepository {
  create(input: CreateContabilidadAuditLogInput): Promise<ContabilidadAuditLogDto>;
  list(applicationId: string, filters: ListContabilidadAuditLogsFilters): Promise<ContabilidadAuditLogDto[]>;
}
