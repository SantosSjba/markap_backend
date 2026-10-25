import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { FinancialExportPort } from './application/ports/financial-export.port';
import { PeriodTransactionPort } from './application/ports/period-transaction.port';
import { ContabilidadAccountOperationsService } from './application/services/contabilidad-account-operations.service';
import { ContabilidadAuditOperationsService } from './application/services/contabilidad-audit-operations.service';
import { ContabilidadClosingOperationsService } from './application/services/contabilidad-closing-operations.service';
import { ContabilidadConfigOperationsService } from './application/services/contabilidad-config-operations.service';
import { ContabilidadContextService } from './application/services/contabilidad-context.service';
import { ContabilidadCpeEmitterService } from './application/services/contabilidad-cpe-emitter.service';
import { ContabilidadCpeOperationsService } from './application/services/contabilidad-cpe-operations.service';
import { ContabilidadCpeUblService } from './application/services/contabilidad-cpe-ubl.service';
import { ContabilidadExtensionsOperationsService } from './application/services/contabilidad-extensions-operations.service';
import { ContabilidadFinancialStatementsOperationsService } from './application/services/contabilidad-financial-statements-operations.service';
import { ContabilidadInventoryOperationsService } from './application/services/contabilidad-inventory-operations.service';
import { ContabilidadJournalOperationsService } from './application/services/contabilidad-journal-operations.service';
import { ContabilidadLegalEntityOperationsService } from './application/services/contabilidad-legal-entity-operations.service';
import { ContabilidadPeriodOperationsService } from './application/services/contabilidad-period-operations.service';
import { ContabilidadPleOperationsService } from './application/services/contabilidad-ple-operations.service';
import { ContabilidadPurchasesOperationsService } from './application/services/contabilidad-purchases-operations.service';
import { ContabilidadReportsOperationsService } from './application/services/contabilidad-reports-operations.service';
import { ContabilidadSalesOperationsService } from './application/services/contabilidad-sales-operations.service';
import { ContabilidadSolOperationsService } from './application/services/contabilidad-sol-operations.service';
import { ContabilidadTaxesOperationsService } from './application/services/contabilidad-taxes-operations.service';
import { ContabilidadTreasuryOperationsService } from './application/services/contabilidad-treasury-operations.service';
import { FinancialExportAdapter } from './infrastructure/exports/financial-export.adapter';
import { PeriodTransactionAdapter } from './infrastructure/persistence/period-transaction.adapter';
import { ContabilidadAccountsController } from './presentation/controllers/contabilidad-accounts.controller';
import { ContabilidadAuditController } from './presentation/controllers/contabilidad-audit.controller';
import { ContabilidadClosingController } from './presentation/controllers/contabilidad-closing.controller';
import { ContabilidadConfigController } from './presentation/controllers/contabilidad-config.controller';
import { ContabilidadCpeController } from './presentation/controllers/contabilidad-cpe.controller';
import { ContabilidadExtensionsController } from './presentation/controllers/contabilidad-extensions.controller';
import { ContabilidadFinancialStatementsController } from './presentation/controllers/contabilidad-financial-statements.controller';
import { ContabilidadInventoryController } from './presentation/controllers/contabilidad-inventory.controller';
import { ContabilidadJournalEntriesController } from './presentation/controllers/contabilidad-journal-entries.controller';
import { ContabilidadLegalEntitiesController } from './presentation/controllers/contabilidad-legal-entities.controller';
import { ContabilidadPeriodsController } from './presentation/controllers/contabilidad-periods.controller';
import { ContabilidadPleController } from './presentation/controllers/contabilidad-ple.controller';
import { ContabilidadPurchasesController } from './presentation/controllers/contabilidad-purchases.controller';
import { ContabilidadReportsController } from './presentation/controllers/contabilidad-reports.controller';
import { ContabilidadSalesController } from './presentation/controllers/contabilidad-sales.controller';
import { ContabilidadSolController } from './presentation/controllers/contabilidad-sol.controller';
import { ContabilidadTaxesController } from './presentation/controllers/contabilidad-taxes.controller';
import { ContabilidadTreasuryController } from './presentation/controllers/contabilidad-treasury.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [
    ContabilidadConfigController,
    ContabilidadAccountsController,
    ContabilidadPeriodsController,
    ContabilidadJournalEntriesController,
    ContabilidadTreasuryController,
    ContabilidadPurchasesController,
    ContabilidadSalesController,
    ContabilidadTaxesController,
    ContabilidadPleController,
    ContabilidadFinancialStatementsController,
    ContabilidadClosingController,
    ContabilidadReportsController,
    ContabilidadExtensionsController,
    ContabilidadInventoryController,
    ContabilidadLegalEntitiesController,
    ContabilidadAuditController,
    ContabilidadCpeController,
    ContabilidadSolController,
  ],
  providers: [
    { provide: FinancialExportPort, useClass: FinancialExportAdapter },
    { provide: PeriodTransactionPort, useClass: PeriodTransactionAdapter },
    ContabilidadConfigOperationsService,
    ContabilidadAccountOperationsService,
    ContabilidadPeriodOperationsService,
    ContabilidadJournalOperationsService,
    ContabilidadTreasuryOperationsService,
    ContabilidadPurchasesOperationsService,
    ContabilidadSalesOperationsService,
    ContabilidadTaxesOperationsService,
    ContabilidadPleOperationsService,
    ContabilidadFinancialStatementsOperationsService,
    ContabilidadClosingOperationsService,
    ContabilidadReportsOperationsService,
    ContabilidadExtensionsOperationsService,
    ContabilidadInventoryOperationsService,
    ContabilidadContextService,
    ContabilidadLegalEntityOperationsService,
    ContabilidadAuditOperationsService,
    ContabilidadCpeOperationsService,
    ContabilidadCpeUblService,
    ContabilidadCpeEmitterService,
    ContabilidadSolOperationsService,
  ],
  exports: [],
})
export class ContabilidadModule {}
