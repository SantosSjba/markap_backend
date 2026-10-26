import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import type {
  AuditInput,
  AuditRecorder,
} from '../../application/ports/audit-recorder.port';
import { PrismaService } from '../database/prisma/prisma.service';
import { AuditContext } from './audit-context';
import { toJsonSafe } from './audit-diff';
@Injectable()
export class AuditService implements AuditRecorder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}
  async record(input: AuditInput): Promise<void> {
    const ctx = AuditContext.get();
    const data = {
      action: input.action,
      userId: input.userId === undefined ? ctx.userId : input.userId,
      source:
        ctx.source === 'SYSTEM' && input.requestId !== undefined
          ? 'HTTP'
          : ctx.source,
      ip: input.ip ?? ctx.ip,
      userAgent: input.userAgent ?? ctx.userAgent,
      requestId: input.requestId ?? ctx.requestId,
      metadata: toJsonSafe(input.metadata ?? {}) as Prisma.InputJsonValue,
    };
    try {
      if (input.outsideTransaction)
        await this.prisma.recordAuditOutsideTransaction(data);
      else await this.prisma.auditLog.create({ data });
    } catch (error: unknown) {
      if (!input.outsideTransaction) throw error;
      this.logger.error(
        { err: error, event: 'audit.record.failed' },
        'No se pudo registrar el evento de auditoría',
      );
    }
  }
}
