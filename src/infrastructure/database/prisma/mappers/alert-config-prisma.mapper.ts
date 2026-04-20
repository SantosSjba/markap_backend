import { AlertConfig } from '@domain/entities/alert-config.entity';

/** Fila devuelta por Prisma para AlertConfig (modelo puede no estar tipado en client aún). */
export class AlertConfigPrismaMapper {
  static toDomain(r: {
    id: string;
    applicationId: string;
    userId: string;
    alert30Days: boolean;
    alert60Days: boolean;
    alert90Days: boolean;
    alertPendingPayment: boolean;
    alertOverduePayment: boolean;
    channelInApp: boolean;
    channelEmail: boolean;
    channelWhatsapp: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AlertConfig {
    return new AlertConfig(
      r.id,
      r.applicationId,
      r.userId,
      r.alert30Days,
      r.alert60Days,
      r.alert90Days,
      r.alertPendingPayment,
      r.alertOverduePayment,
      r.channelInApp,
      r.channelEmail,
      r.channelWhatsapp,
      r.createdAt,
      r.updatedAt,
    );
  }
}
