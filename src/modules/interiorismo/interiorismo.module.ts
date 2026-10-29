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
  GetInteriorCatalogMaterialStatsUseCase,
} from './application/use-cases/interior-catalog-materials/interior-catalog-materials.use-cases';
import {
  CreateInteriorExecutionActualCostUseCase,
  CreateInteriorExecutionEvidenceUseCase,
  CreateInteriorExecutionIncidentUseCase,
  CreateInteriorExecutionTaskUseCase,
  DeleteInteriorExecutionActualCostUseCase,
  CreateInteriorExecutionMilestoneUseCase,
  UpdateInteriorExecutionMilestoneUseCase,
  DeleteInteriorExecutionMilestoneUseCase,
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
  GetInteriorMaterialSupplierStatsUseCase,
} from './application/use-cases/interior-material-suppliers/interior-material-suppliers.use-cases';
import {
  DeleteInteriorProjectBudgetAttachmentUseCase,
  ListInteriorProjectBudgetAttachmentsUseCase,
  UploadInteriorProjectBudgetAttachmentUseCase,
} from './application/use-cases/interior-project-budget/budget-attachments.use-case';
import { DuplicateInteriorProjectBudgetSnapshotUseCase } from './application/use-cases/interior-project-budget/duplicate-budget-snapshot.use-case';
import { ImportInteriorProjectBudgetFromExcelUseCase } from './application/use-cases/interior-project-budget/import-budget-from-excel.use-case';
import {
  ActivateInteriorBudgetVersionUseCase,
  CreateInteriorBudgetRowsUseCase,
  CreateInteriorBudgetSupplierPaymentUseCase,
  DeleteInteriorBudgetRowUseCase,
  DeleteInteriorBudgetSupplierPaymentUseCase,
  GetInteriorProjectBudgetUseCase,
  GetInteriorProjectSettlementUseCase,
  MoveInteriorBudgetRowUseCase,
  UpdateInteriorBudgetHeaderUseCase,
  UpdateInteriorBudgetRowUseCase,
} from './application/use-cases/interior-project-budget/project-budget.use-cases';
import { ExportInteriorProjectBudgetExcelUseCase } from './application/use-cases/interior-project-budget/export-budget-excel.use-case';
import { InteriorBudgetSpreadsheetPort } from './application/ports/interior-budget-spreadsheet.port';
import { InteriorBudgetSpreadsheetAdapter } from './infrastructure/spreadsheets/interior-budget-spreadsheet.adapter';
import { RenderInteriorProjectBudgetHtmlUseCase } from './application/use-cases/interior-project-budget/render-interior-project-budget-html.use-case';
import { SyncInteriorProjectBudgetFromExecutionUseCase } from './application/use-cases/interior-project-budget/sync-budget-from-execution.use-case';
import { CreateInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/create-interior-project-document.use-case';
import { DeleteInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/delete-interior-project-document.use-case';
import { GetInteriorProjectDocumentStatsUseCase } from './application/use-cases/interior-project-documents/get-interior-project-document-stats.use-case';
import { ListInteriorProjectDocumentsUseCase } from './application/use-cases/interior-project-documents/list-interior-project-documents.use-case';
import { UpdateInteriorProjectDocumentUseCase } from './application/use-cases/interior-project-documents/update-interior-project-document.use-case';
import { CreateInteriorProjectUseCase } from './application/use-cases/interior-projects/create-interior-project.use-case';
import { GetInteriorProjectByIdUseCase } from './application/use-cases/interior-projects/get-interior-project-by-id.use-case';
import { ListInteriorProjectsUseCase } from './application/use-cases/interior-projects/list-interior-projects.use-case';
import { UpdateInteriorProjectUseCase } from './application/use-cases/interior-projects/update-interior-project.use-case';
import {
  CreateInteriorProjectActivityUseCase,
  DeleteInteriorProjectActivityUseCase,
} from './application/use-cases/interior-projects/interior-project-activities.use-cases';
import {
  ListInteriorClientPaymentsUseCase,
  SummarizeInteriorClientProjectsUseCase,
} from './application/use-cases/interior-projects/interior-client-projects.use-cases';
import { GetInteriorProjectStatsUseCase } from './application/use-cases/interior-projects/get-interior-project-stats.use-case';
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
    CreateInteriorProjectActivityUseCase,
    DeleteInteriorProjectActivityUseCase,
    GetInteriorProjectStatsUseCase,
    SummarizeInteriorClientProjectsUseCase,
    ListInteriorClientPaymentsUseCase,
    GetInteriorProjectBudgetUseCase,
    GetInteriorProjectSettlementUseCase,
    UpdateInteriorBudgetHeaderUseCase,
    CreateInteriorBudgetRowsUseCase,
    UpdateInteriorBudgetRowUseCase,
    MoveInteriorBudgetRowUseCase,
    DeleteInteriorBudgetRowUseCase,
    CreateInteriorBudgetSupplierPaymentUseCase,
    DeleteInteriorBudgetSupplierPaymentUseCase,
    ActivateInteriorBudgetVersionUseCase,
    ExportInteriorProjectBudgetExcelUseCase,
    {
      provide: InteriorBudgetSpreadsheetPort,
      useClass: InteriorBudgetSpreadsheetAdapter,
    },
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
    GetInteriorCatalogMaterialStatsUseCase,
    ListInteriorMaterialSuppliersUseCase,
    GetInteriorMaterialSupplierByIdUseCase,
    CreateInteriorMaterialSupplierUseCase,
    UpdateInteriorMaterialSupplierUseCase,
    DeleteInteriorMaterialSupplierUseCase,
    LinkInteriorSupplierCatalogMaterialUseCase,
    UnlinkInteriorSupplierCatalogMaterialUseCase,
    RecordInteriorMaterialPurchaseUseCase,
    GetInteriorMaterialSupplierStatsUseCase,
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
    CreateInteriorExecutionMilestoneUseCase,
    UpdateInteriorExecutionMilestoneUseCase,
    DeleteInteriorExecutionMilestoneUseCase,
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
    GetInteriorProjectDocumentStatsUseCase,
    CreateInteriorProjectDocumentUseCase,
    UpdateInteriorProjectDocumentUseCase,
    DeleteInteriorProjectDocumentUseCase,
    GetInteriorReportsDashboardUseCase,
  ],
  exports: [],
})
export class InteriorismoModule {}
