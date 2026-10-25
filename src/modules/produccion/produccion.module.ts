import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { ProduccionConfigOperationsService } from './application/services/produccion-config-operations.service';
import {
  CreateProduccionExtraCostCatalogUseCase,
  DeleteProduccionExtraCostCatalogUseCase,
  GetProduccionExtraCostCatalogByIdUseCase,
  ListProduccionExtraCostCatalogUseCase,
  UpdateProduccionExtraCostCatalogUseCase,
} from './application/use-cases/produccion-extra-cost-catalog/produccion-extra-cost-catalog.use-cases';
import {
  CreateProduccionFurnitureCostingSnapshotUseCase,
  GetProduccionFurnitureCostingUseCase,
  ListProduccionFurnitureCostingSnapshotsUseCase,
  UpdateProduccionFurnitureCostingUseCase,
} from './application/use-cases/produccion-furniture-costing/produccion-furniture-costing.use-cases';
import {
  CreateProduccionFurnitureUseCase,
  DeleteProduccionFurnitureUseCase,
  GetProduccionFurnitureByIdUseCase,
  GetProduccionFurnitureStatsUseCase,
  ListProduccionFurnitureUseCase,
  UpdateProduccionFurnitureUseCase,
} from './application/use-cases/produccion-furniture/produccion-furniture.use-cases';
import {
  CreateProduccionLaborRateUseCase,
  DeleteProduccionLaborRateUseCase,
  GetProduccionLaborRateByIdUseCase,
  ListProduccionLaborRatesUseCase,
  UpdateProduccionLaborRateUseCase,
} from './application/use-cases/produccion-labor-rates/produccion-labor-rates.use-cases';
import {
  CreateProduccionMaterialUseCase,
  CreateProduccionStockMovementUseCase,
  DeleteProduccionMaterialUseCase,
  GetProduccionInventoryStatsUseCase,
  GetProduccionMaterialByIdUseCase,
  ListProduccionMaterialsUseCase,
  ListProduccionStockMovementsUseCase,
  UpdateProduccionMaterialUseCase,
} from './application/use-cases/produccion-materials/produccion-materials.use-cases';
import {
  CancelProduccionPurchaseOrderUseCase,
  CreateProduccionPurchaseOrderUseCase,
  DeleteProduccionPurchaseOrderUseCase,
  GetProduccionPurchaseOrderByIdUseCase,
  ListProduccionPurchaseOrdersUseCase,
  ReceiveProduccionPurchaseOrderUseCase,
  SendProduccionPurchaseOrderUseCase,
  UpdateProduccionPurchaseOrderUseCase,
} from './application/use-cases/produccion-purchase-orders/produccion-purchase-orders.use-cases';
import { GetProduccionReportsDashboardUseCase } from './application/use-cases/produccion-reports/get-produccion-reports-dashboard.use-case';
import {
  AcceptProduccionQuotationUseCase,
  CancelProduccionDeliveryUseCase,
  CancelProduccionOrderUseCase,
  CompleteProduccionDeliveryUseCase,
  ConfirmProduccionOrderUseCase,
  ConvertProduccionQuotationToOrderUseCase,
  CreateProduccionDeliveryUseCase,
  CreateProduccionOrderUseCase,
  CreateProduccionQuotationUseCase,
  CreateWorkOrderFromProduccionOrderUseCase,
  DeleteProduccionDeliveryUseCase,
  DeleteProduccionOrderUseCase,
  DeleteProduccionQuotationUseCase,
  GetProduccionDeliveryByIdUseCase,
  GetProduccionOrderByIdUseCase,
  GetProduccionQuotationByIdUseCase,
  ListProduccionDeliveriesUseCase,
  ListProduccionOrdersUseCase,
  ListProduccionQuotationsUseCase,
  MarkProduccionOrderReadyUseCase,
  RejectProduccionQuotationUseCase,
  SendProduccionQuotationUseCase,
  UpdateProduccionDeliveryUseCase,
  UpdateProduccionOrderUseCase,
  UpdateProduccionQuotationUseCase,
} from './application/use-cases/produccion-sales/produccion-sales.use-cases';
import { RenderProduccionQuotationHtmlUseCase } from './application/use-cases/produccion-sales/render-produccion-quotation-html.use-case';
import {
  CreateProduccionSupplierUseCase,
  DeleteProduccionSupplierUseCase,
  GetProduccionSupplierByIdUseCase,
  LinkProduccionSupplierMaterialUseCase,
  ListProduccionSuppliersUseCase,
  UnlinkProduccionSupplierMaterialUseCase,
  UpdateProduccionSupplierUseCase,
} from './application/use-cases/produccion-suppliers/produccion-suppliers.use-cases';
import {
  CancelProduccionWorkOrderUseCase,
  CompleteProduccionWorkOrderUseCase,
  ConsumeProduccionWorkOrderMaterialsUseCase,
  CreateProduccionWorkOrderUseCase,
  DeleteProduccionWorkOrderUseCase,
  GetProduccionWorkOrderByIdUseCase,
  GetProduccionWorkOrderStatsUseCase,
  ListProduccionWorkOrdersUseCase,
  StartProduccionWorkOrderUseCase,
  UpdateProduccionWorkOrderStageUseCase,
  UpdateProduccionWorkOrderUseCase,
} from './application/use-cases/produccion-work-orders/produccion-work-orders.use-cases';
import { ProduccionConfigController } from './presentation/controllers/produccion-config.controller';
import { ProduccionDeliveriesController } from './presentation/controllers/produccion-deliveries.controller';
import { ProduccionExtraCostsController } from './presentation/controllers/produccion-extra-costs.controller';
import { ProduccionFurnitureCostingController } from './presentation/controllers/produccion-furniture-costing.controller';
import { ProduccionFurnitureController } from './presentation/controllers/produccion-furniture.controller';
import { ProduccionLaborRatesController } from './presentation/controllers/produccion-labor-rates.controller';
import { ProduccionMaterialsController } from './presentation/controllers/produccion-materials.controller';
import { ProduccionOrdersController } from './presentation/controllers/produccion-orders.controller';
import { ProduccionPurchaseOrdersController } from './presentation/controllers/produccion-purchase-orders.controller';
import { ProduccionQuotationsController } from './presentation/controllers/produccion-quotations.controller';
import { ProduccionReportsController } from './presentation/controllers/produccion-reports.controller';
import { ProduccionStockMovementsController } from './presentation/controllers/produccion-stock-movements.controller';
import { ProduccionSuppliersController } from './presentation/controllers/produccion-suppliers.controller';
import { ProduccionWorkOrdersController } from './presentation/controllers/produccion-work-orders.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [
    ProduccionFurnitureController,
    ProduccionLaborRatesController,
    ProduccionExtraCostsController,
    ProduccionFurnitureCostingController,
    ProduccionMaterialsController,
    ProduccionStockMovementsController,
    ProduccionSuppliersController,
    ProduccionPurchaseOrdersController,
    ProduccionWorkOrdersController,
    ProduccionQuotationsController,
    ProduccionOrdersController,
    ProduccionDeliveriesController,
    ProduccionReportsController,
    ProduccionConfigController,
  ],
  providers: [
    ProduccionConfigOperationsService,
    ListProduccionFurnitureUseCase,
    GetProduccionFurnitureStatsUseCase,
    GetProduccionFurnitureByIdUseCase,
    CreateProduccionFurnitureUseCase,
    UpdateProduccionFurnitureUseCase,
    DeleteProduccionFurnitureUseCase,
    ListProduccionLaborRatesUseCase,
    GetProduccionLaborRateByIdUseCase,
    CreateProduccionLaborRateUseCase,
    UpdateProduccionLaborRateUseCase,
    DeleteProduccionLaborRateUseCase,
    ListProduccionExtraCostCatalogUseCase,
    GetProduccionExtraCostCatalogByIdUseCase,
    CreateProduccionExtraCostCatalogUseCase,
    UpdateProduccionExtraCostCatalogUseCase,
    DeleteProduccionExtraCostCatalogUseCase,
    GetProduccionFurnitureCostingUseCase,
    UpdateProduccionFurnitureCostingUseCase,
    CreateProduccionFurnitureCostingSnapshotUseCase,
    ListProduccionFurnitureCostingSnapshotsUseCase,
    ListProduccionMaterialsUseCase,
    GetProduccionInventoryStatsUseCase,
    GetProduccionMaterialByIdUseCase,
    CreateProduccionMaterialUseCase,
    UpdateProduccionMaterialUseCase,
    DeleteProduccionMaterialUseCase,
    ListProduccionStockMovementsUseCase,
    CreateProduccionStockMovementUseCase,
    ListProduccionSuppliersUseCase,
    GetProduccionSupplierByIdUseCase,
    CreateProduccionSupplierUseCase,
    UpdateProduccionSupplierUseCase,
    DeleteProduccionSupplierUseCase,
    LinkProduccionSupplierMaterialUseCase,
    UnlinkProduccionSupplierMaterialUseCase,
    ListProduccionPurchaseOrdersUseCase,
    GetProduccionPurchaseOrderByIdUseCase,
    CreateProduccionPurchaseOrderUseCase,
    UpdateProduccionPurchaseOrderUseCase,
    SendProduccionPurchaseOrderUseCase,
    ReceiveProduccionPurchaseOrderUseCase,
    CancelProduccionPurchaseOrderUseCase,
    DeleteProduccionPurchaseOrderUseCase,
    ListProduccionWorkOrdersUseCase,
    GetProduccionWorkOrderStatsUseCase,
    GetProduccionWorkOrderByIdUseCase,
    CreateProduccionWorkOrderUseCase,
    UpdateProduccionWorkOrderUseCase,
    StartProduccionWorkOrderUseCase,
    UpdateProduccionWorkOrderStageUseCase,
    CompleteProduccionWorkOrderUseCase,
    CancelProduccionWorkOrderUseCase,
    ConsumeProduccionWorkOrderMaterialsUseCase,
    DeleteProduccionWorkOrderUseCase,
    ListProduccionQuotationsUseCase,
    GetProduccionQuotationByIdUseCase,
    CreateProduccionQuotationUseCase,
    UpdateProduccionQuotationUseCase,
    SendProduccionQuotationUseCase,
    AcceptProduccionQuotationUseCase,
    RejectProduccionQuotationUseCase,
    ConvertProduccionQuotationToOrderUseCase,
    DeleteProduccionQuotationUseCase,
    RenderProduccionQuotationHtmlUseCase,
    ListProduccionOrdersUseCase,
    GetProduccionOrderByIdUseCase,
    CreateProduccionOrderUseCase,
    UpdateProduccionOrderUseCase,
    ConfirmProduccionOrderUseCase,
    CreateWorkOrderFromProduccionOrderUseCase,
    MarkProduccionOrderReadyUseCase,
    CancelProduccionOrderUseCase,
    DeleteProduccionOrderUseCase,
    ListProduccionDeliveriesUseCase,
    GetProduccionDeliveryByIdUseCase,
    CreateProduccionDeliveryUseCase,
    UpdateProduccionDeliveryUseCase,
    CompleteProduccionDeliveryUseCase,
    CancelProduccionDeliveryUseCase,
    DeleteProduccionDeliveryUseCase,
    GetProduccionReportsDashboardUseCase,
  ],
  exports: [],
})
export class ProduccionModule {}
