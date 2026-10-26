import { AuditModule } from '../shared/infrastructure/audit/audit.module';
import { Module } from '@nestjs/common';
import { ArquitecturaModule } from '../modules/arquitectura/arquitectura.module';
import { ContabilidadModule } from '../modules/contabilidad/contabilidad.module';
import { CrmModule } from '../modules/crm/crm.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { InteriorismoModule } from '../modules/interiorismo/interiorismo.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { ProduccionModule } from '../modules/produccion/produccion.module';
import { PropertiesModule } from '../modules/properties/properties.module';
import { RentalsModule } from '../modules/rentals/rentals.module';
import { VentasModule } from '../modules/ventas/ventas.module';
import { RuntimeModule } from './runtime.module';
import { APP_GUARD } from '@nestjs/core';
import { ApplicationAccessModule } from '../modules/identity/application-access.module';
import { ApplicationAccessGuard } from '../shared/presentation/guards/application-access.guard';
@Module({
  providers: [{ provide: APP_GUARD, useClass: ApplicationAccessGuard }],
  imports: [
    ApplicationAccessModule,
    AuditModule,
    CrmModule,
    IdentityModule,
    RentalsModule,
    PropertiesModule,
    RuntimeModule,
    NotificationsModule,
    VentasModule,
    InteriorismoModule,
    ArquitecturaModule,
    ProduccionModule,
    ContabilidadModule,
  ],
})
export class ApiModule {}
