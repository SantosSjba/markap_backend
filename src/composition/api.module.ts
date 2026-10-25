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
@Module({
  imports: [
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
