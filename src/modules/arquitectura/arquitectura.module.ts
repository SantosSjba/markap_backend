import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { ArquitecturaConfigOperationsService } from './application/services/arquitectura-config-operations.service';
import {
  CreateArquitecturaCalendarEventUseCase,
  DeleteArquitecturaCalendarEventUseCase,
  GetArquitecturaCalendarFeedUseCase,
  UpdateArquitecturaCalendarEventUseCase,
} from './application/use-cases/arquitectura-calendar/arquitectura-calendar.use-cases';
import {
  CreateArquitecturaCatalogMaterialUseCase,
  DeleteArquitecturaCatalogMaterialUseCase,
  GetArquitecturaCatalogMaterialByIdUseCase,
  ListArquitecturaCatalogMaterialsUseCase,
  UpdateArquitecturaCatalogMaterialUseCase,
} from './application/use-cases/arquitectura-catalog-materials/arquitectura-catalog-materials.use-cases';
import {
  CreateArquitecturaExecutionActualCostUseCase,
  CreateArquitecturaExecutionEvidenceUseCase,
  CreateArquitecturaExecutionIncidentUseCase,
  CreateArquitecturaExecutionTaskUseCase,
  DeleteArquitecturaExecutionActualCostUseCase,
  DeleteArquitecturaExecutionEvidenceUseCase,
  DeleteArquitecturaExecutionTaskUseCase,
  GetArquitecturaExecutionOverviewUseCase,
  PatchArquitecturaExecutionProgressUseCase,
  UpdateArquitecturaExecutionIncidentUseCase,
  UpdateArquitecturaExecutionTaskUseCase,
} from './application/use-cases/arquitectura-execution/arquitectura-execution.use-cases';
import {
  CreateArquitecturaFinancePaymentUseCase,
  CreateArquitecturaFinanceScheduleUseCase,
  DeleteArquitecturaFinancePaymentUseCase,
  DeleteArquitecturaFinanceScheduleUseCase,
  GetArquitecturaFinanceOverviewUseCase,
  UpdateArquitecturaFinancePaymentUseCase,
  UpdateArquitecturaFinanceScheduleUseCase,
} from './application/use-cases/arquitectura-finance/arquitectura-finance.use-cases';
import {
  CreateArquitecturaMaterialSupplierUseCase,
  DeleteArquitecturaMaterialSupplierUseCase,
  GetArquitecturaMaterialSupplierByIdUseCase,
  LinkArquitecturaSupplierCatalogMaterialUseCase,
  ListArquitecturaMaterialSuppliersUseCase,
  RecordArquitecturaMaterialPurchaseUseCase,
  UnlinkArquitecturaSupplierCatalogMaterialUseCase,
  UpdateArquitecturaMaterialSupplierUseCase,
} from './application/use-cases/arquitectura-material-suppliers/arquitectura-material-suppliers.use-cases';
import {
  DeleteArquitecturaProjectBudgetAttachmentUseCase,
  ListArquitecturaProjectBudgetAttachmentsUseCase,
  UploadArquitecturaProjectBudgetAttachmentUseCase,
} from './application/use-cases/arquitectura-project-budget/budget-attachments.use-case';
import { DuplicateArquitecturaProjectBudgetSnapshotUseCase } from './application/use-cases/arquitectura-project-budget/duplicate-budget-snapshot.use-case';
import { ImportArquitecturaProjectBudgetFromExcelUseCase } from './application/use-cases/arquitectura-project-budget/import-budget-from-excel.use-case';
import { ListArquitecturaProjectBudgetSummariesUseCase } from './application/use-cases/arquitectura-project-budget/list-budget-summaries.use-case';
import {
  CreateArquitecturaLineItemSupplierPaymentUseCase,
  CreateArquitecturaProjectBudgetLineItemUseCase,
  CreateArquitecturaProjectBudgetSectionUseCase,
  DeleteArquitecturaLineItemSupplierPaymentUseCase,
  DeleteArquitecturaProjectBudgetLineItemUseCase,
  DeleteArquitecturaProjectBudgetSectionUseCase,
  GetArquitecturaProjectBudgetUseCase,
  GetArquitecturaProjectSettlementUseCase,
  UpdateArquitecturaProjectBudgetLineItemUseCase,
  UpdateArquitecturaProjectBudgetSectionUseCase,
} from './application/use-cases/arquitectura-project-budget/project-budget.use-cases';
import { RenderArquitecturaProjectBudgetHtmlUseCase } from './application/use-cases/arquitectura-project-budget/render-arquitectura-project-budget-html.use-case';
import { SyncArquitecturaProjectBudgetFromExecutionUseCase } from './application/use-cases/arquitectura-project-budget/sync-budget-from-execution.use-case';
import { CreateArquitecturaProjectDocumentUseCase } from './application/use-cases/arquitectura-project-documents/create-arquitectura-project-document.use-case';
import { DeleteArquitecturaProjectDocumentUseCase } from './application/use-cases/arquitectura-project-documents/delete-arquitectura-project-document.use-case';
import { ListArquitecturaProjectDocumentsUseCase } from './application/use-cases/arquitectura-project-documents/list-arquitectura-project-documents.use-case';
import { UpdateArquitecturaProjectDocumentUseCase } from './application/use-cases/arquitectura-project-documents/update-arquitectura-project-document.use-case';
import { CreateArquitecturaProjectUseCase } from './application/use-cases/arquitectura-projects/create-arquitectura-project.use-case';
import { GetArquitecturaProjectByIdUseCase } from './application/use-cases/arquitectura-projects/get-arquitectura-project-by-id.use-case';
import { ListArquitecturaProjectsUseCase } from './application/use-cases/arquitectura-projects/list-arquitectura-projects.use-case';
import { UpdateArquitecturaProjectUseCase } from './application/use-cases/arquitectura-projects/update-arquitectura-project.use-case';
import { GetArquitecturaReportsDashboardUseCase } from './application/use-cases/arquitectura-reports/get-arquitectura-reports-dashboard.use-case';
import { ArquitecturaCalendarController } from './presentation/controllers/arquitectura-calendar.controller';
import { ArquitecturaCatalogMaterialsController } from './presentation/controllers/arquitectura-catalog-materials.controller';
import { ArquitecturaConfigController } from './presentation/controllers/arquitectura-config.controller';
import { ArquitecturaDocumentsController } from './presentation/controllers/arquitectura-documents.controller';
import { ArquitecturaExecutionController } from './presentation/controllers/arquitectura-execution.controller';
import { ArquitecturaFinanceController } from './presentation/controllers/arquitectura-finance.controller';
import { ArquitecturaMaterialSuppliersController } from './presentation/controllers/arquitectura-material-suppliers.controller';
import { ArquitecturaProjectBudgetController } from './presentation/controllers/arquitectura-project-budget.controller';
import { ArquitecturaProjectsController } from './presentation/controllers/arquitectura-projects.controller';
import { ArquitecturaReportsController } from './presentation/controllers/arquitectura-reports.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [
    ArquitecturaConfigController,
    ArquitecturaProjectsController,
    ArquitecturaProjectBudgetController,
    ArquitecturaFinanceController,
    ArquitecturaCalendarController,
    ArquitecturaDocumentsController,
    ArquitecturaExecutionController,
    ArquitecturaCatalogMaterialsController,
    ArquitecturaMaterialSuppliersController,
    ArquitecturaReportsController,
  ],
  providers: [
    ArquitecturaConfigOperationsService,
    ListArquitecturaProjectsUseCase,
    GetArquitecturaProjectByIdUseCase,
    CreateArquitecturaProjectUseCase,
    UpdateArquitecturaProjectUseCase,
    GetArquitecturaProjectBudgetUseCase,
    GetArquitecturaProjectSettlementUseCase,
    CreateArquitecturaProjectBudgetSectionUseCase,
    UpdateArquitecturaProjectBudgetSectionUseCase,
    DeleteArquitecturaProjectBudgetSectionUseCase,
    CreateArquitecturaProjectBudgetLineItemUseCase,
    UpdateArquitecturaProjectBudgetLineItemUseCase,
    DeleteArquitecturaProjectBudgetLineItemUseCase,
    CreateArquitecturaLineItemSupplierPaymentUseCase,
    DeleteArquitecturaLineItemSupplierPaymentUseCase,
    RenderArquitecturaProjectBudgetHtmlUseCase,
    DuplicateArquitecturaProjectBudgetSnapshotUseCase,
    SyncArquitecturaProjectBudgetFromExecutionUseCase,
    ImportArquitecturaProjectBudgetFromExcelUseCase,
    ListArquitecturaProjectBudgetAttachmentsUseCase,
    UploadArquitecturaProjectBudgetAttachmentUseCase,
    DeleteArquitecturaProjectBudgetAttachmentUseCase,
    ListArquitecturaProjectBudgetSummariesUseCase,
    CreateArquitecturaFinancePaymentUseCase,
    CreateArquitecturaFinanceScheduleUseCase,
    DeleteArquitecturaFinancePaymentUseCase,
    DeleteArquitecturaFinanceScheduleUseCase,
    GetArquitecturaFinanceOverviewUseCase,
    UpdateArquitecturaFinancePaymentUseCase,
    UpdateArquitecturaFinanceScheduleUseCase,
    GetArquitecturaCalendarFeedUseCase,
    CreateArquitecturaCalendarEventUseCase,
    UpdateArquitecturaCalendarEventUseCase,
    DeleteArquitecturaCalendarEventUseCase,
    ListArquitecturaProjectDocumentsUseCase,
    CreateArquitecturaProjectDocumentUseCase,
    UpdateArquitecturaProjectDocumentUseCase,
    DeleteArquitecturaProjectDocumentUseCase,
    GetArquitecturaExecutionOverviewUseCase,
    CreateArquitecturaExecutionTaskUseCase,
    UpdateArquitecturaExecutionTaskUseCase,
    DeleteArquitecturaExecutionTaskUseCase,
    CreateArquitecturaExecutionEvidenceUseCase,
    DeleteArquitecturaExecutionEvidenceUseCase,
    CreateArquitecturaExecutionIncidentUseCase,
    UpdateArquitecturaExecutionIncidentUseCase,
    CreateArquitecturaExecutionActualCostUseCase,
    DeleteArquitecturaExecutionActualCostUseCase,
    PatchArquitecturaExecutionProgressUseCase,
    ListArquitecturaCatalogMaterialsUseCase,
    GetArquitecturaCatalogMaterialByIdUseCase,
    CreateArquitecturaCatalogMaterialUseCase,
    UpdateArquitecturaCatalogMaterialUseCase,
    DeleteArquitecturaCatalogMaterialUseCase,
    ListArquitecturaMaterialSuppliersUseCase,
    GetArquitecturaMaterialSupplierByIdUseCase,
    CreateArquitecturaMaterialSupplierUseCase,
    UpdateArquitecturaMaterialSupplierUseCase,
    DeleteArquitecturaMaterialSupplierUseCase,
    LinkArquitecturaSupplierCatalogMaterialUseCase,
    UnlinkArquitecturaSupplierCatalogMaterialUseCase,
    RecordArquitecturaMaterialPurchaseUseCase,
    GetArquitecturaReportsDashboardUseCase,
  ],
  exports: [],
})
export class ArquitecturaModule {}
