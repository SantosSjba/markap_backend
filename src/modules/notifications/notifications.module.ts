import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { DataChangedInterceptor } from '../../shared/presentation/interceptors/data-changed.interceptor';
import { NotificationDeliveryPort } from './application/ports/notification-delivery.port';
import { RentalAlertQueryPort } from './application/ports/rental-alert-query.port';
import { NotificationsService } from './application/services/notifications.service';
import { GetAlertConfigUseCase } from './application/use-cases/alert-config/get-alert-config.use-case';
import { UpsertAlertConfigUseCase } from './application/use-cases/alert-config/upsert-alert-config.use-case';
import { RentalAlertPrismaAdapter } from './infrastructure/persistence/rental-alert-prisma.adapter';
import { RentalAlertsScheduler } from './infrastructure/scheduling/rental-alerts.scheduler';
import { AlertConfigController } from './presentation/controllers/alert-config.controller';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsGateway } from './presentation/gateways/notifications.gateway';
@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    RuntimeModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController, AlertConfigController],
  providers: [
    { provide: NotificationDeliveryPort, useExisting: NotificationsGateway },
    { provide: RentalAlertQueryPort, useClass: RentalAlertPrismaAdapter },
    { provide: APP_INTERCEPTOR, useClass: DataChangedInterceptor },
    NotificationsGateway,
    NotificationsService,
    GetAlertConfigUseCase,
    UpsertAlertConfigUseCase,
    RentalAlertsScheduler,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
