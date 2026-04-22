import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ALERT_CONFIG_REPOSITORY, APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { AlertConfigRepository } from '@domain/repositories/alert-config.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';

export interface UpsertAlertConfigInput {
  userId: string;
  applicationSlug: string;
  alert30Days?: boolean;
  alert60Days?: boolean;
  alert90Days?: boolean;
  alertPendingPayment?: boolean;
  alertOverduePayment?: boolean;
  channelInApp?: boolean;
  channelEmail?: boolean;
  channelWhatsapp?: boolean;
}

@Injectable()
export class UpsertAlertConfigUseCase {
  constructor(
    @Inject(ALERT_CONFIG_REPOSITORY)
    private readonly alertConfigRepository: AlertConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: UpsertAlertConfigInput) {
    const { applicationSlug, userId, ...rest } = input;

    const app = await this.applicationRepository.findBySlug(applicationSlug);
    if (!app) throw new NotFoundException(`Aplicación '${applicationSlug}' no encontrada`);

    return this.alertConfigRepository.upsert({
      applicationId: app.id,
      userId,
      ...rest,
    });
  }
}
