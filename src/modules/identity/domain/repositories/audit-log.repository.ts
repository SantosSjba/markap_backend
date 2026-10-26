export interface AuditLogFilters {
  userId?: string;
  applicationId?: string;
  action?: string;
  tableName?: string;
  recordId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
export interface AuditLogItem {
  id: string;
  occurredAt: Date;
  action: string;
  tableName: string | null;
  recordId: string | null;
  applicationId: string | null;
  applicationName: string | null;
  userId: string | null;
  userName: string | null;
  changes: unknown;
  snapshot: unknown;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  source: string;
}
export abstract class AuditLogRepository {
  abstract list(filters: AuditLogFilters): Promise<{
    items: AuditLogItem[];
    total: number;
    page: number;
    limit: number;
  }>;
  abstract get(id: string): Promise<AuditLogItem | null>;
}
