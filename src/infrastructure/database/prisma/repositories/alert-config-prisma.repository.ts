import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  AlertConfigRepository,
  AlertConfigData,
  UpsertAlertConfigData,
} from '../../../../application/repositories/alert-config.repository';

@Injectable()
export class AlertConfigPrismaRepository implements AlertConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndApp(
    userId: string,
    applicationId: string,
  ): Promise<AlertConfigData | null> {
    const record = await (this.prisma as any).alertConfig.findUnique({
      where: { applicationId_userId: { applicationId, userId } },
    });
    return record ? this.map(record) : null;
  }

  async upsert(data: UpsertAlertConfigData): Promise<AlertConfigData> {
    const { applicationId, userId, ...fields } = data;
    const record = await (this.prisma as any).alertConfig.upsert({
      where: { applicationId_userId: { applicationId, userId } },
      create: { applicationId, userId, ...fields },
      update: { ...fields },
    });
    return this.map(record);
  }

  private map(r: any): AlertConfigData {
    return {
      id: r.id,
      applicationId: r.applicationId,
      userId: r.userId,
      alert30Days: r.alert30Days,
      alert60Days: r.alert60Days,
      alert90Days: r.alert90Days,
      alertPendingPayment: r.alertPendingPayment,
      alertOverduePayment: r.alertOverduePayment,
      channelInApp: r.channelInApp,
      channelEmail: r.channelEmail,
      channelWhatsapp: r.channelWhatsapp,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
