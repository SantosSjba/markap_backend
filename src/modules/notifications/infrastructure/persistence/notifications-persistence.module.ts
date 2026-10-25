import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { ALERT_CONFIG_REPOSITORY } from '../../domain/repositories/alert-config.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository';
import { AlertConfigPrismaRepository } from './repositories/alert-config-prisma.repository';
import { NotificationPrismaRepository } from './repositories/notification-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationPrismaRepository,
    },
    {
      provide: ALERT_CONFIG_REPOSITORY,
      useClass: AlertConfigPrismaRepository,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY, ALERT_CONFIG_REPOSITORY],
})
export class NotificationsPersistenceModule {}
