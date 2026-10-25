import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VentasComplianceOperationsService } from './application/services/ventas-compliance-operations.service';
import { VentasConfigOperationsService } from './application/services/ventas-config-operations.service';
import { VentasFinanzasOperationsService } from './application/services/ventas-finanzas-operations.service';
import { VentasReportsOperationsService } from './application/services/ventas-reports-operations.service';
import { VentasSalesOperationsService } from './application/services/ventas-sales-operations.service';
import { VentasComplianceController } from './presentation/controllers/ventas-compliance.controller';
import { VentasConfigController } from './presentation/controllers/ventas-config.controller';
import { VentasFinanzasController } from './presentation/controllers/ventas-finanzas.controller';
import { VentasReportsController } from './presentation/controllers/ventas-reports.controller';
import { VentasSalesController } from './presentation/controllers/ventas-sales.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule, NotificationsModule],
  controllers: [
    VentasSalesController,
    VentasFinanzasController,
    VentasReportsController,
    VentasConfigController,
    VentasComplianceController,
  ],
  providers: [
    VentasSalesOperationsService,
    VentasFinanzasOperationsService,
    VentasReportsOperationsService,
    VentasConfigOperationsService,
    VentasComplianceOperationsService,
  ],
  exports: [],
})
export class VentasModule {}
