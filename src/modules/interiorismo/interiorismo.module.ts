import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { InteriorismoConfigOperationsService } from './application/services/interiorismo-config-operations.service';
import {
  CreateInteriorCalendarEventUseCase,
  DeleteInteriorCalendarEventUseCase,
  GetInteriorCalendarFeedUseCase,
  UpdateInteriorCalendarEventUseCase,
} from './application/use-cases/interior-calendar/interior-calendar.use-cases';
import {
  CreateInteriorCatalogMaterialUseCase,
  DeleteInteriorCatalogMaterialUseCase,
  GetInteriorCatalogMaterialByIdUseCase,
  ListInteriorCatalogMaterialsUseCase,
  UpdateInteriorCatalogMaterialUseCase,
} from './application/use-cases/interior-catalog-materials/interior-catalog-materials.use-cases';
import {
  CreateInteriorExecutionActualCostUseCase,
  CreateInteriorExecutionEvidenceUseCase,
  CreateInteriorExecutionIncidentUseCase,
  CreateInteriorExecutionTaskUseCase,
  DeleteInteriorExecutionActualCostUseCase,
  DeleteInteriorExecutionEvidenceUseCase,
  DeleteInteriorExecutionTaskUseCase,
  GetInteriorExecutionOverviewUseCase,
  PatchInteriorExecutionProgressUseCase,
  UpdateInteriorExecutionIncidentUseCase,
  UpdateInteriorExecutionTaskUseCase,
} from './application/use-cases/interior-execution/interior-execution.use-cases';
import {
  CreateInteriorFinancePaymentUseCase,
  CreateInteriorFinanceScheduleUseCase,
  DeleteInteriorFinancePaymentUseCase,
  DeleteInteriorFinanceScheduleUseCase,
  GetInteriorFinanceOverviewUseCase,
  UpdateInteriorFinancePaymentUseCase,
  UpdateInteriorFinanceScheduleUseCase,
} from './application/use-cases/interior-finance/interior-finance.use-cases';
import {
  CreateInteriorMaterialSupplierUseCase,
  DeleteInteriorMaterialSupplierUseCase,
  GetInteriorMaterialSupplierByIdUseCase,
  LinkInteriorSupplierCatalogMaterialUseCase,
  ListInteriorMaterialSuppliersUseCase,
  RecordInteriorMaterialPurchaseUseCase,
  UnlinkInteriorSupplierCatalogMaterialUseCase,
  UpdateInteriorMaterialSupplierUseCase,
} from './application/use-cases/interior-material-suppliers/interior-material-suppliers.use-cases';
import {
  DeleteInteriorProjectBudgetAttachmentUseCase,
  ListInteriorProjectBudgetAttachmentsUseCase,
  UploadInteriorProjectBudgetAttachmentUseCase,
} from './application/use-cases/interior-project-budget/budget-attachments.use-case';
import { DuplicateInteriorProjectBudgetSnapshotUseCase } from './application/use-cases/interior-project-budget/duplicate-budget-snapshot.use-case';
import { ImportInteriorProjectBudgetFromExcelUseCase } from './application/use-cases/interior-project-budget/import-budget-from-excel.use-case';
import {
  CreateInteriorLineItemSupplierPaymentUseCase,
  CreateInteriorProjectBudgetLineItemUseCase,
  CreateInteriorProjectBudgetSectionUseCase,
  DeleteInteriorLineItemSupplierPaymentUseCase,
  DeleteInteriorProjectBudgetLineItemUseCase,
  DeleteInteriorProjectBudgetSectionUseCase,
  GetInteriorProjectBudgetUseCase,
  GetInteriorProjectSettlementUseCase,
  UpdateInteriorProjectBudgetLineItemUseCase,
  UpdateInteriorProjectBudgetSectionUseCase,
} from './application/use-cases/interior-project-budget/project-budget.use-cases';
import { RenderInteriorProjectBudgetHtmlUseCase } from './application/use-cases/interior-project-budget/render-interior-project-budget-html.use-case';
import { SyncInteriorProjectBudgetFromExecutionUseCase } from './application/use-cases/interior-project-budget/sync-budget-from-execution.use-case';
import { CreateInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/create-interior-project-document.use-case';
import { DeleteInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/delete-interior-project-document.use-case';
import { ListInteriorProjectDocumentsUseCase } from './application/use-cases/interior-project-documents/list-interior-project-documents.use-case';
import { UpdateInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/update-interior-project-document.use-case';
import { CreateInteriorProjectUseCase } from './application/use-cases/interior-projects/create-interior-project.use-case';
import { GetInteriorProjectByIdUseCase } from './application/use-cases/interior-projects/get-interior-project-by-id.use-case';
import { ListInteriorProjectsUseCase } from './application/use-cases/interior-projects/list-interior-projects.use-case';
import { UpdateInteriorProjectUseCase } from './application/use-cases/interior-projects/update-interior-project.use-case';
import { GetInteriorReportsDashboardUseCase } from './application/use-cases/interior-reports/get-interior-reports-dashboard.use-case';
import { InteriorismoCalendarController } from './presentation/controllers/interiorismo-calendar.controller';
import { InteriorismoCatalogMaterialsController } from './presentation/controllers/interiorismo-catalog-materials.controller';
import { InteriorismoConfigController } from './presentation/controllers/interiorismo-config.controller';
import { InteriorismoDocumentsController } from './presentation/controllers/interiorismo-documents.controller';
import { InteriorismoExecutionController } from './presentation/controllers/interiorismo-execution.controller';
import { InteriorismoFinanceController } from './presentation/controllers/interiorismo-finance.controller';
import { InteriorismoMaterialSuppliersController } from './presentation/controllers/interiorismo-material-suppliers.controller';
import { InteriorismoProjectBudgetController } from './presentation/controllers/interiorismo-project-budget.controller';
import { InteriorismoProjectsController } from './presentation/controllers/interiorismo-projects.controller';
import { InteriorismoReportsController } from './presentation/controllers/interiorismo-reports.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [
    InteriorismoConfigController,
    InteriorismoProjectsController,
    InteriorismoProjectBudgetController,
    InteriorismoCatalogMaterialsController,
    InteriorismoMaterialSuppliersController,
    InteriorismoExecutionController,
    InteriorismoFinanceController,
    InteriorismoCalendarController,
    InteriorismoDocumentsController,
    InteriorismoReportsController,
  ],
  providers: [
    InteriorismoConfigOperationsService,
    ListInteriorProjectsUseCase,
    GetInteriorProjectByIdUseCase,
    CreateInteriorProjectUseCase,
    UpdateInteriorProjectUseCase,
    GetInteriorProjectBudgetUseCase,
    GetInteriorProjectSettlementUseCase,
    CreateInteriorProjectBudgetSectionUseCase,
    UpdateInteriorProjectBudgetSectionUseCase,
    DeleteInteriorProjectBudgetSectionUseCase,
    CreateInteriorProjectBudgetLineItemUseCase,
    UpdateInteriorProjectBudgetLineItemUseCase,
    DeleteInteriorProjectBudgetLineItemUseCase,
    CreateInteriorLineItemSupplierPaymentUseCase,
    DeleteInteriorLineItemSupplierPaymentUseCase,
    RenderInteriorProjectBudgetHtmlUseCase,
    DuplicateInteriorProjectBudgetSnapshotUseCase,
    SyncInteriorProjectBudgetFromExecutionUseCase,
    ImportInteriorProjectBudgetFromExcelUseCase,
    ListInteriorProjectBudgetAttachmentsUseCase,
    UploadInteriorProjectBudgetAttachmentUseCase,
    DeleteInteriorProjectBudgetAttachmentUseCase,
    ListInteriorCatalogMaterialsUseCase,
    GetInteriorCatalogMaterialByIdUseCase,
    CreateInteriorCatalogMaterialUseCase,
    UpdateInteriorCatalogMaterialUseCase,
    DeleteInteriorCatalogMaterialUseCase,
    ListInteriorMaterialSuppliersUseCase,
    GetInteriorMaterialSupplierByIdUseCase,
    CreateInteriorMaterialSupplierUseCase,
    UpdateInteriorMaterialSupplierUseCase,
    DeleteInteriorMaterialSupplierUseCase,
    LinkInteriorSupplierCatalogMaterialUseCase,
    UnlinkInteriorSupplierCatalogMaterialUseCase,
    RecordInteriorMaterialPurchaseUseCase,
    GetInteriorExecutionOverviewUseCase,
    CreateInteriorExecutionTaskUseCase,
    UpdateInteriorExecutionTaskUseCase,
    DeleteInteriorExecutionTaskUseCase,
    CreateInteriorExecutionEvidenceUseCase,
    DeleteInteriorExecutionEvidenceUseCase,
    CreateInteriorExecutionIncidentUseCase,
    UpdateInteriorExecutionIncidentUseCase,
    CreateInteriorExecutionActualCostUseCase,
    DeleteInteriorExecutionActualCostUseCase,
    PatchInteriorExecutionProgressUseCase,
    GetInteriorFinanceOverviewUseCase,
    CreateInteriorFinanceScheduleUseCase,
    UpdateInteriorFinanceScheduleUseCase,
    DeleteInteriorFinanceScheduleUseCase,
    CreateInteriorFinancePaymentUseCase,
    UpdateInteriorFinancePaymentUseCase,
    DeleteInteriorFinancePaymentUseCase,
    GetInteriorCalendarFeedUseCase,
    CreateInteriorCalendarEventUseCase,
    UpdateInteriorCalendarEventUseCase,
    DeleteInteriorCalendarEventUseCase,
    ListInteriorProjectDocumentsUseCase,
    CreateInteriorProjectDocumentUseCase,
    UpdateInteriorProjectDocumentUseCase,
    DeleteInteriorProjectDocumentUseCase,
    GetInteriorReportsDashboardUseCase,
  ],
  exports: [],
})
export class InteriorismoModule {}
