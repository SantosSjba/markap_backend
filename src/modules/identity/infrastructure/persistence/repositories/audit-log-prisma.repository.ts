import { Injectable } from '@nestjs/common';
import { Prisma, type AuditLog } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { parseDateOnly } from '../../../../../shared/domain/utils/peru-date.util';
import {
  AuditLogRepository,
  type AuditLogFilters,
} from '../../../domain/repositories/audit-log.repository';
@Injectable()
export class AuditLogPrismaRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}
  async list(f: AuditLogFilters) {
    const page = Math.max(1, f.page ?? 1),
      limit = Math.min(200, Math.max(1, f.limit ?? 50));
    const where: Prisma.AuditLogWhereInput = {
      userId: f.userId,
      applicationId: f.applicationId,
      action: f.action,
      tableName: f.tableName,
      recordId: f.recordId,
    };
    // parseDateOnly representa el mediodía UTC: el inicio del día Lima es 7 h antes.
    if (f.from || f.to)
      where.occurredAt = {
        ...(f.from
          ? { gte: new Date(parseDateOnly(f.from).getTime() - 7 * 3600000) }
          : {}),
        ...(f.to
          ? { lt: new Date(parseDateOnly(f.to).getTime() + 17 * 3600000) }
          : {}),
      };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items: await this.enrich(rows), total, page, limit };
  }
  async get(id: string) {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? (await this.enrich([row]))[0] : null;
  }
  private async enrich(rows: AuditLog[]) {
    const [users, apps] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { in: rows.flatMap((r) => (r.userId ? [r.userId] : [])) },
        },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.application.findMany({
        where: {
          id: {
            in: rows.flatMap((r) => (r.applicationId ? [r.applicationId] : [])),
          },
        },
        select: { id: true, name: true },
      }),
    ]);
    const userNames = new Map(
        users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]),
      ),
      appNames = new Map(apps.map((a) => [a.id, a.name]));
    return rows.map((r) => ({
      ...r,
      userName: r.userId ? (userNames.get(r.userId) ?? null) : null,
      applicationName: r.applicationId
        ? (appNames.get(r.applicationId) ?? null)
        : null,
    }));
  }
}
