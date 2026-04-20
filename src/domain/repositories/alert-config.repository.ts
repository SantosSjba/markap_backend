import type { AlertConfig } from '@domain/entities/alert-config.entity';

export interface UpsertAlertConfigData {
  applicationId: string;
  userId: string;

  alert30Days?: boolean;
  alert60Days?: boolean;
  alert90Days?: boolean;

  alertPendingPayment?: boolean;
  alertOverduePayment?: boolean;

  channelInApp?: boolean;
  channelEmail?: boolean;
  channelWhatsapp?: boolean;
}

export const ALERT_CONFIG_REPOSITORY = Symbol('AlertConfigRepository');

export interface AlertConfigRepository {
  findByUserAndApp(
    userId: string,
    applicationId: string,
  ): Promise<AlertConfig | null>;

  upsert(data: UpsertAlertConfigData): Promise<AlertConfig>;
}
