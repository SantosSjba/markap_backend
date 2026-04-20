import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AlertConfigPrismaMapper } from '../mappers/alert-config-prisma.mapper';
import type { AlertConfigRepository, UpsertAlertConfigData } from '@domain/repositories/alert-config.repository';
import type { AlertConfig } from '@domain/entities/alert-config.entity';

@Injectable()
export class AlertConfigPrismaRepository implements AlertConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndApp(
    userId: string,
    applicationId: string,
  ): Promise<AlertConfig | null> {
    const record = await (this.prisma as any).alertConfig.findUnique({
      where: { applicationId_userId: { applicationId, userId } },
    });
    return record ? AlertConfigPrismaMapper.toDomain(record) : null;
  }

  async upsert(data: UpsertAlertConfigData): Promise<AlertConfig> {
    const { applicationId, userId, ...fields } = data;
    const record = await (this.prisma as any).alertConfig.upsert({
      where: { applicationId_userId: { applicationId, userId } },
      create: { applicationId, userId, ...fields },
      update: { ...fields },
    });
    return AlertConfigPrismaMapper.toDomain(record);
  }
}
