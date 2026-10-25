import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type { AlertConfig } from '../../../domain/entities/alert-config.entity';
import type {
  AlertConfigRepository,
  UpsertAlertConfigData,
} from '../../../domain/repositories/alert-config.repository';
import { AlertConfigPrismaMapper } from '../mappers/alert-config-prisma.mapper';

@Injectable()
export class AlertConfigPrismaRepository implements AlertConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndApp(
    userId: string,
    applicationId: string,
  ): Promise<AlertConfig | null> {
    const record = await this.prisma.alertConfig.findUnique({
      where: { applicationId_userId: { applicationId, userId } },
    });
    return record ? AlertConfigPrismaMapper.toDomain(record) : null;
  }

  async upsert(data: UpsertAlertConfigData): Promise<AlertConfig> {
    const { applicationId, userId, ...fields } = data;
    const record = await this.prisma.alertConfig.upsert({
      where: { applicationId_userId: { applicationId, userId } },
      create: { applicationId, userId, ...fields },
      update: { ...fields },
    });
    return AlertConfigPrismaMapper.toDomain(record);
  }
}
