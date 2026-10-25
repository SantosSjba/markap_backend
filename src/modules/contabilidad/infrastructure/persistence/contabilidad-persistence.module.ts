import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import { CONTABILIDAD_ACCOUNT_REPOSITORY } from '../../domain/repositories/contabilidad-account.repository';
import { CONTABILIDAD_AUDIT_REPOSITORY } from '../../domain/repositories/contabilidad-audit.repository';
import { CONTABILIDAD_CONFIG_REPOSITORY } from '../../domain/repositories/contabilidad-config.repository';
import { CONTABILIDAD_CPE_REPOSITORY } from '../../domain/repositories/contabilidad-cpe.repository';
import { CONTABILIDAD_EXTENSIONS_REPOSITORY } from '../../domain/repositories/contabilidad-extensions.repository';
import { CONTABILIDAD_FINANCIAL_REPOSITORY } from '../../domain/repositories/contabilidad-financial.repository';
import { CONTABILIDAD_INVENTORY_REPOSITORY } from '../../domain/repositories/contabilidad-inventory.repository';
import { CONTABILIDAD_JOURNAL_REPOSITORY } from '../../domain/repositories/contabilidad-journal.repository';
import { CONTABILIDAD_LEGAL_ENTITY_REPOSITORY } from '../../domain/repositories/contabilidad-legal-entity.repository';
import { CONTABILIDAD_PERIOD_REPOSITORY } from '../../domain/repositories/contabilidad-period.repository';
import { CONTABILIDAD_PLE_REPOSITORY } from '../../domain/repositories/contabilidad-ple.repository';
import { CONTABILIDAD_PURCHASES_REPOSITORY } from '../../domain/repositories/contabilidad-purchases.repository';
import { CONTABILIDAD_REPORTS_REPOSITORY } from '../../domain/repositories/contabilidad-reports.repository';
import { CONTABILIDAD_SALES_REPOSITORY } from '../../domain/repositories/contabilidad-sales.repository';
import { CONTABILIDAD_SOL_REPOSITORY } from '../../domain/repositories/contabilidad-sol.repository';
import { CONTABILIDAD_TAXES_REPOSITORY } from '../../domain/repositories/contabilidad-taxes.repository';
import { CONTABILIDAD_TREASURY_REPOSITORY } from '../../domain/repositories/contabilidad-treasury.repository';
import { ContabilidadAccountPrismaRepository } from './repositories/contabilidad-account-prisma.repository';
import { ContabilidadAuditPrismaRepository } from './repositories/contabilidad-audit-prisma.repository';
import { ContabilidadConfigPrismaRepository } from './repositories/contabilidad-config-prisma.repository';
import { ContabilidadCpePrismaRepository } from './repositories/contabilidad-cpe-prisma.repository';
import { ContabilidadExtensionsPrismaRepository } from './repositories/contabilidad-extensions-prisma.repository';
import { ContabilidadFinancialPrismaRepository } from './repositories/contabilidad-financial-prisma.repository';
import { ContabilidadInventoryPrismaRepository } from './repositories/contabilidad-inventory-prisma.repository';
import { ContabilidadJournalPrismaRepository } from './repositories/contabilidad-journal-prisma.repository';
import { ContabilidadLegalEntityPrismaRepository } from './repositories/contabilidad-legal-entity-prisma.repository';
import { ContabilidadPeriodPrismaRepository } from './repositories/contabilidad-period-prisma.repository';
import { ContabilidadPlePrismaRepository } from './repositories/contabilidad-ple-prisma.repository';
import { ContabilidadPurchasesPrismaRepository } from './repositories/contabilidad-purchases-prisma.repository';
import { ContabilidadReportsPrismaRepository } from './repositories/contabilidad-reports-prisma.repository';
import { ContabilidadSalesPrismaRepository } from './repositories/contabilidad-sales-prisma.repository';
import { ContabilidadSolPrismaRepository } from './repositories/contabilidad-sol-prisma.repository';
import { ContabilidadTaxesPrismaRepository } from './repositories/contabilidad-taxes-prisma.repository';
import { ContabilidadTreasuryPrismaRepository } from './repositories/contabilidad-treasury-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: CONTABILIDAD_CONFIG_REPOSITORY,
      useClass: ContabilidadConfigPrismaRepository,
    },
    {
      provide: CONTABILIDAD_ACCOUNT_REPOSITORY,
      useClass: ContabilidadAccountPrismaRepository,
    },
    {
      provide: CONTABILIDAD_PERIOD_REPOSITORY,
      useClass: ContabilidadPeriodPrismaRepository,
    },
    {
      provide: CONTABILIDAD_JOURNAL_REPOSITORY,
      useClass: ContabilidadJournalPrismaRepository,
    },
    {
      provide: CONTABILIDAD_TREASURY_REPOSITORY,
      useClass: ContabilidadTreasuryPrismaRepository,
    },
    {
      provide: CONTABILIDAD_PURCHASES_REPOSITORY,
      useClass: ContabilidadPurchasesPrismaRepository,
    },
    {
      provide: CONTABILIDAD_SALES_REPOSITORY,
      useClass: ContabilidadSalesPrismaRepository,
    },
    {
      provide: CONTABILIDAD_TAXES_REPOSITORY,
      useClass: ContabilidadTaxesPrismaRepository,
    },
    {
      provide: CONTABILIDAD_PLE_REPOSITORY,
      useClass: ContabilidadPlePrismaRepository,
    },
    {
      provide: CONTABILIDAD_FINANCIAL_REPOSITORY,
      useClass: ContabilidadFinancialPrismaRepository,
    },
    {
      provide: CONTABILIDAD_REPORTS_REPOSITORY,
      useFactory: (
        prisma: PrismaService,
        financial: ContabilidadFinancialPrismaRepository,
        taxes: ContabilidadTaxesPrismaRepository,
      ) => new ContabilidadReportsPrismaRepository(prisma, financial, taxes),
      inject: [
        PrismaService,
        CONTABILIDAD_FINANCIAL_REPOSITORY,
        CONTABILIDAD_TAXES_REPOSITORY,
      ],
    },
    {
      provide: CONTABILIDAD_EXTENSIONS_REPOSITORY,
      useClass: ContabilidadExtensionsPrismaRepository,
    },
    {
      provide: CONTABILIDAD_INVENTORY_REPOSITORY,
      useClass: ContabilidadInventoryPrismaRepository,
    },
    {
      provide: CONTABILIDAD_LEGAL_ENTITY_REPOSITORY,
      useClass: ContabilidadLegalEntityPrismaRepository,
    },
    {
      provide: CONTABILIDAD_AUDIT_REPOSITORY,
      useClass: ContabilidadAuditPrismaRepository,
    },
    {
      provide: CONTABILIDAD_CPE_REPOSITORY,
      useClass: ContabilidadCpePrismaRepository,
    },
    {
      provide: CONTABILIDAD_SOL_REPOSITORY,
      useClass: ContabilidadSolPrismaRepository,
    },
  ],
  exports: [
    CONTABILIDAD_CONFIG_REPOSITORY,
    CONTABILIDAD_ACCOUNT_REPOSITORY,
    CONTABILIDAD_PERIOD_REPOSITORY,
    CONTABILIDAD_JOURNAL_REPOSITORY,
    CONTABILIDAD_TREASURY_REPOSITORY,
    CONTABILIDAD_PURCHASES_REPOSITORY,
    CONTABILIDAD_SALES_REPOSITORY,
    CONTABILIDAD_TAXES_REPOSITORY,
    CONTABILIDAD_PLE_REPOSITORY,
    CONTABILIDAD_FINANCIAL_REPOSITORY,
    CONTABILIDAD_REPORTS_REPOSITORY,
    CONTABILIDAD_EXTENSIONS_REPOSITORY,
    CONTABILIDAD_INVENTORY_REPOSITORY,
    CONTABILIDAD_LEGAL_ENTITY_REPOSITORY,
    CONTABILIDAD_AUDIT_REPOSITORY,
    CONTABILIDAD_CPE_REPOSITORY,
    CONTABILIDAD_SOL_REPOSITORY,
  ],
})
export class ContabilidadPersistenceModule {}
