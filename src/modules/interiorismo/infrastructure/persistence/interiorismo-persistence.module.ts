import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { INTERIOR_CALENDAR_REPOSITORY } from '../../domain/repositories/interior-calendar.repository';
import { INTERIOR_CATALOG_MATERIAL_REPOSITORY } from '../../domain/repositories/interior-catalog-material.repository';
import { INTERIOR_EXECUTION_REPOSITORY } from '../../domain/repositories/interior-execution.repository';
import { INTERIOR_FINANCE_REPOSITORY } from '../../domain/repositories/interior-finance.repository';
import { INTERIOR_MATERIAL_SUPPLIER_REPOSITORY } from '../../domain/repositories/interior-material-supplier.repository';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '../../domain/repositories/interior-project-budget.repository';
import { INTERIOR_PROJECT_DOCUMENT_REPOSITORY } from '../../domain/repositories/interior-project-document.repository';
import { INTERIOR_PROJECT_REPOSITORY } from '../../domain/repositories/interior-project.repository';
import { INTERIOR_REPORTS_REPOSITORY } from '../../domain/repositories/interior-reports.repository';
import { INTERIORISMO_CONFIG_REPOSITORY } from '../../domain/repositories/interiorismo-config.repository';
import { InteriorCalendarPrismaRepository } from './repositories/interior-calendar-prisma.repository';
import { InteriorCatalogMaterialPrismaRepository } from './repositories/interior-catalog-material-prisma.repository';
import { InteriorExecutionPrismaRepository } from './repositories/interior-execution-prisma.repository';
import { InteriorFinancePrismaRepository } from './repositories/interior-finance-prisma.repository';
import { InteriorMaterialSupplierPrismaRepository } from './repositories/interior-material-supplier-prisma.repository';
import { InteriorProjectBudgetPrismaRepository } from './repositories/interior-project-budget-prisma.repository';
import { InteriorProjectDocumentPrismaRepository } from './repositories/interior-project-document-prisma.repository';
import { InteriorProjectPrismaRepository } from './repositories/interior-project-prisma.repository';
import { InteriorReportsPrismaRepository } from './repositories/interior-reports-prisma.repository';
import { InteriorismoConfigPrismaRepository } from './repositories/interiorismo-config-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: INTERIORISMO_CONFIG_REPOSITORY,
      useClass: InteriorismoConfigPrismaRepository,
    },
    {
      provide: INTERIOR_PROJECT_REPOSITORY,
      useClass: InteriorProjectPrismaRepository,
    },
    {
      provide: INTERIOR_PROJECT_BUDGET_REPOSITORY,
      useClass: InteriorProjectBudgetPrismaRepository,
    },
    {
      provide: INTERIOR_CATALOG_MATERIAL_REPOSITORY,
      useClass: InteriorCatalogMaterialPrismaRepository,
    },
    {
      provide: INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
      useClass: InteriorMaterialSupplierPrismaRepository,
    },
    {
      provide: INTERIOR_EXECUTION_REPOSITORY,
      useClass: InteriorExecutionPrismaRepository,
    },
    {
      provide: INTERIOR_FINANCE_REPOSITORY,
      useClass: InteriorFinancePrismaRepository,
    },
    {
      provide: INTERIOR_CALENDAR_REPOSITORY,
      useClass: InteriorCalendarPrismaRepository,
    },
    {
      provide: INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
      useClass: InteriorProjectDocumentPrismaRepository,
    },
    {
      provide: INTERIOR_REPORTS_REPOSITORY,
      useClass: InteriorReportsPrismaRepository,
    },
  ],
  exports: [
    INTERIORISMO_CONFIG_REPOSITORY,
    INTERIOR_PROJECT_REPOSITORY,
    INTERIOR_PROJECT_BUDGET_REPOSITORY,
    INTERIOR_CATALOG_MATERIAL_REPOSITORY,
    INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
    INTERIOR_EXECUTION_REPOSITORY,
    INTERIOR_FINANCE_REPOSITORY,
    INTERIOR_CALENDAR_REPOSITORY,
    INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
    INTERIOR_REPORTS_REPOSITORY,
  ],
})
export class InteriorismoPersistenceModule {}
