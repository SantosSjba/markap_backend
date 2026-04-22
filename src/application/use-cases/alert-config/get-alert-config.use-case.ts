import { Inject, Injectable } from '@nestjs/common';
import { ALERT_CONFIG_REPOSITORY, APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { AlertConfigRepository } from '@domain/repositories/alert-config.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class GetAlertConfigUseCase {
  constructor(
    @Inject(ALERT_CONFIG_REPOSITORY)
    private readonly alertConfigRepository: AlertConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(userId: string, applicationSlug: string) {
    const app = await this.applicationRepository.findBySlug(applicationSlug);
    if (!app) throw new NotFoundException(`Aplicación '${applicationSlug}' no encontrada`);

    const config = await this.alertConfigRepository.findByUserAndApp(userId, app.id);
    if (!config) {
      // Devolver defaults si no existe configuración
      return {
        id: null,
        applicationId: app.id,
        userId,
        alert30Days: true,
        alert60Days: true,
        alert90Days: false,
        alertPendingPayment: true,
        alertOverduePayment: true,
        channelInApp: true,
        channelEmail: false,
        channelWhatsapp: false,
      };
    }
    return config;
  }
}
