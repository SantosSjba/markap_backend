import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  ContabilidadAuditLogDto,
  ContabilidadAuditRepository,
  CreateContabilidadAuditLogInput,
  ListContabilidadAuditLogsFilters,
} from '@domain/repositories/contabilidad-audit.repository';
import { PrismaService } from '../prisma.service';
import {
  endOfLimaDayInstant,
  startOfLimaDayInstant,
} from '@domain/utils/peru-date.util';

@Injectable()
export class ContabilidadAuditPrismaRepository implements ContabilidadAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateContabilidadAuditLogInput): Promise<ContabilidadAuditLogDto> {
    const row = await this.prisma.contabilidadAuditLog.create({
      data: {
        applicationId: input.applicationId,
        legalEntityId: input.legalEntityId ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        action: input.action,
        userId: input.userId ?? null,
        summary: input.summary ?? null,
        payload: input.payload ? (input.payload as Prisma.InputJsonValue) : undefined,
      },
      include: {
        legalEntity: { select: { code: true, ruc: true } },
      },
    });

    return this.mapRow(row);
  }

  async list(applicationId: string, filters: ListContabilidadAuditLogsFilters): Promise<ContabilidadAuditLogDto[]> {
    const where: Prisma.ContabilidadAuditLogWhereInput = { applicationId };

    if (filters.legalEntityId) where.legalEntityId = filters.legalEntityId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = filters.action;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = startOfLimaDayInstant(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = endOfLimaDayInstant(filters.dateTo);
    }

    const rows = await this.prisma.contabilidadAuditLog.findMany({
      where,
      include: { legalEntity: { select: { code: true, ruc: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(filters.limit ?? 100, 1), 500),
    });

    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: {
    id: string;
    legalEntityId: string | null;
    entityType: string;
    entityId: string | null;
    action: string;
    userId: string | null;
    summary: string | null;
    payload: unknown;
    createdAt: Date;
    legalEntity: { code: string; ruc: string } | null;
  }): ContabilidadAuditLogDto {
    return {
      id: row.id,
      legalEntityId: row.legalEntityId,
      legalEntityCode: row.legalEntity?.code ?? null,
      legalEntityRuc: row.legalEntity?.ruc ?? null,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      userId: row.userId,
      summary: row.summary,
      payload: row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
