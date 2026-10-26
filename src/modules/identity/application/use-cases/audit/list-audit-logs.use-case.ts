import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditLogRepository,
  type AuditLogFilters,
} from '../../../domain/repositories/audit-log.repository';
@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly repository: AuditLogRepository) {}
  execute(filters: AuditLogFilters) {
    return this.repository.list(filters);
  }
  async get(id: string) {
    const row = await this.repository.get(id);
    if (!row)
      throw new NotFoundException('Registro de auditoría no encontrado');
    return row;
  }
}
