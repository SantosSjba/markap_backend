import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { ARQUITECTURA_CALENDAR_REPOSITORY } from '../../domain/repositories/arquitectura-calendar.repository';
import { ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY } from '../../domain/repositories/arquitectura-catalog-material.repository';
import { ARQUITECTURA_CONFIG_REPOSITORY } from '../../domain/repositories/arquitectura-config.repository';
import { ARQUITECTURA_EXECUTION_REPOSITORY } from '../../domain/repositories/arquitectura-execution.repository';
import { ARQUITECTURA_FINANCE_REPOSITORY } from '../../domain/repositories/arquitectura-finance.repository';
import { ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY } from '../../domain/repositories/arquitectura-material-supplier.repository';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '../../domain/repositories/arquitectura-project-budget.repository';
import { ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY } from '../../domain/repositories/arquitectura-project-document.repository';
import { ARQUITECTURA_PROJECT_REPOSITORY } from '../../domain/repositories/arquitectura-project.repository';
import { ARQUITECTURA_REPORTS_REPOSITORY } from '../../domain/repositories/arquitectura-reports.repository';
import { ArquitecturaCalendarPrismaRepository } from './repositories/arquitectura-calendar-prisma.repository';
import { ArquitecturaCatalogMaterialPrismaRepository } from './repositories/arquitectura-catalog-material-prisma.repository';
import { ArquitecturaConfigPrismaRepository } from './repositories/arquitectura-config-prisma.repository';
import { ArquitecturaExecutionPrismaRepository } from './repositories/arquitectura-execution-prisma.repository';
import { ArquitecturaFinancePrismaRepository } from './repositories/arquitectura-finance-prisma.repository';
import { ArquitecturaMaterialSupplierPrismaRepository } from './repositories/arquitectura-material-supplier-prisma.repository';
import { ArquitecturaProjectBudgetPrismaRepository } from './repositories/arquitectura-project-budget-prisma.repository';
import { ArquitecturaProjectDocumentPrismaRepository } from './repositories/arquitectura-project-document-prisma.repository';
import { ArquitecturaProjectPrismaRepository } from './repositories/arquitectura-project-prisma.repository';
import { ArquitecturaReportsPrismaRepository } from './repositories/arquitectura-reports-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: ARQUITECTURA_CONFIG_REPOSITORY,
      useClass: ArquitecturaConfigPrismaRepository,
    },
    {
      provide: ARQUITECTURA_PROJECT_REPOSITORY,
      useClass: ArquitecturaProjectPrismaRepository,
    },
    {
      provide: ARQUITECTURA_PROJECT_BUDGET_REPOSITORY,
      useClass: ArquitecturaProjectBudgetPrismaRepository,
    },
    {
      provide: ARQUITECTURA_FINANCE_REPOSITORY,
      useClass: ArquitecturaFinancePrismaRepository,
    },
    {
      provide: ARQUITECTURA_CALENDAR_REPOSITORY,
      useClass: ArquitecturaCalendarPrismaRepository,
    },
    {
      provide: ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
      useClass: ArquitecturaProjectDocumentPrismaRepository,
    },
    {
      provide: ARQUITECTURA_EXECUTION_REPOSITORY,
      useClass: ArquitecturaExecutionPrismaRepository,
    },
    {
      provide: ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY,
      useClass: ArquitecturaCatalogMaterialPrismaRepository,
    },
    {
      provide: ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY,
      useClass: ArquitecturaMaterialSupplierPrismaRepository,
    },
    {
      provide: ARQUITECTURA_REPORTS_REPOSITORY,
      useClass: ArquitecturaReportsPrismaRepository,
    },
  ],
  exports: [
    ARQUITECTURA_CONFIG_REPOSITORY,
    ARQUITECTURA_PROJECT_REPOSITORY,
    ARQUITECTURA_PROJECT_BUDGET_REPOSITORY,
    ARQUITECTURA_FINANCE_REPOSITORY,
    ARQUITECTURA_CALENDAR_REPOSITORY,
    ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
    ARQUITECTURA_EXECUTION_REPOSITORY,
    ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY,
    ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY,
    ARQUITECTURA_REPORTS_REPOSITORY,
  ],
})
export class ArquitecturaPersistenceModule {}
