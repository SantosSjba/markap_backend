import { Module } from '@nestjs/common';
import { ArquitecturaPersistenceModule } from '../../../modules/arquitectura/infrastructure/persistence/arquitectura-persistence.module';
import { ContabilidadPersistenceModule } from '../../../modules/contabilidad/infrastructure/persistence/contabilidad-persistence.module';
import { CrmPersistenceModule } from '../../../modules/crm/infrastructure/persistence/crm-persistence.module';
import { IdentityPersistenceModule } from '../../../modules/identity/infrastructure/persistence/identity-persistence.module';
import { InteriorismoPersistenceModule } from '../../../modules/interiorismo/infrastructure/persistence/interiorismo-persistence.module';
import { NotificationsPersistenceModule } from '../../../modules/notifications/infrastructure/persistence/notifications-persistence.module';
import { ProduccionPersistenceModule } from '../../../modules/produccion/infrastructure/persistence/produccion-persistence.module';
import { PropertiesPersistenceModule } from '../../../modules/properties/infrastructure/persistence/properties-persistence.module';
import { RentalsPersistenceModule } from '../../../modules/rentals/infrastructure/persistence/rentals-persistence.module';
import { VentasPersistenceModule } from '../../../modules/ventas/infrastructure/persistence/ventas-persistence.module';
import { PrismaModule } from './prisma.module';
@Module({
  imports: [
    PrismaModule,
    IdentityPersistenceModule,
    CrmPersistenceModule,
    PropertiesPersistenceModule,
    RentalsPersistenceModule,
    NotificationsPersistenceModule,
    VentasPersistenceModule,
    InteriorismoPersistenceModule,
    ArquitecturaPersistenceModule,
    ProduccionPersistenceModule,
    ContabilidadPersistenceModule,
  ],
  exports: [
    PrismaModule,
    IdentityPersistenceModule,
    CrmPersistenceModule,
    PropertiesPersistenceModule,
    RentalsPersistenceModule,
    NotificationsPersistenceModule,
    VentasPersistenceModule,
    InteriorismoPersistenceModule,
    ArquitecturaPersistenceModule,
    ProduccionPersistenceModule,
    ContabilidadPersistenceModule,
  ],
})
export class DatabaseModule {}
