import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';

// Services
import { HashService } from '@domain/services/hash.service';
import { TokenService } from '@domain/services/token.service';
import { MailService } from '@domain/services/mail.service';
import { BcryptHashService } from '../services/bcrypt-hash.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { NodemailerMailService } from '../services/nodemailer-mail.service';

// Use Cases - Auth
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '../../application/use-cases/auth';

// Use Cases - Applications
import {
  GetUserApplicationsUseCase,
  GetAllApplicationsUseCase,
  GetApplicationByIdUseCase,
  CreateApplicationUseCase,
  UpdateApplicationUseCase,
  DeleteApplicationUseCase,
} from '../../application/use-cases/applications';

// Use Cases - Menus
import {
  GetMenusByApplicationUseCase,
  GetMenusFlatUseCase,
  CreateMenuUseCase,
  UpdateMenuUseCase,
  DeleteMenuUseCase,
} from '../../application/use-cases/menus';

// Use Cases - Roles
import {
  GetUserRolesUseCase,
  GetAllRolesUseCase,
    GetRoleByIdUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignApplicationToRoleUseCase,
    RevokeApplicationFromRoleUseCase,
    GetApplicationsByRoleUseCase,
} from '../../application/use-cases/roles';

// Use Cases - Users
import {
  GetAllUsersUseCase,
  UpdateUserUseCase,
  ToggleUserActiveUseCase,
  AssignUserRoleUseCase,
  RevokeUserRoleUseCase,
} from '../../application/use-cases/users';

// Use Cases - Clients
import {
  CreateClientUseCase,
  ListClientsUseCase,
  GetClientStatsUseCase,
  GetClientByIdUseCase,
  UpdateClientUseCase,
  DeleteClientUseCase,
} from '../../application/use-cases/clients';

// Use Cases - Properties
import {
  CreatePropertyUseCase,
  GetPropertyByIdUseCase,
  ListPropertiesUseCase,
  GetPropertyStatsUseCase,
  UpdatePropertyUseCase,
  UpdatePropertyListingStatusUseCase,
  DeletePropertyUseCase,
} from '../../application/use-cases/properties';

// Use Cases - Rentals
import {
  CreateRentalUseCase,
  ListRentalsUseCase,
  GetRentalStatsUseCase,
  GetRentalByIdUseCase,
  UpdateRentalUseCase,
  GetRentalFinancialConfigUseCase,
  UpsertRentalFinancialConfigUseCase,
  GetRentalFinancialBreakdownUseCase,
  CancelRentalUseCase,
} from '../../application/use-cases/rentals';

// Use Cases - Agents
import {
  CreateAgentUseCase,
  ListAgentsUseCase,
  GetAgentByIdUseCase,
  UpdateAgentUseCase,
  DeleteAgentUseCase,
} from '../../application/use-cases/agents';

// Use Cases - Reports
import {
  GetReportsSummaryUseCase,
  GetContractsExpiringUseCase,
  GetPropertiesWithoutContractUseCase,
  GetActiveClientsReportUseCase,
  GetContractStatusSummaryUseCase,
  GetMonthlyMetricsUseCase,
  GetRentalsByMonthUseCase,
  GetFinancialDistributionReportUseCase,
} from '../../application/use-cases/reports';

// Use Cases - Payments
import {
  GetPaymentStatsUseCase,
  ListPendingPaymentsUseCase,
  RegisterPaymentUseCase,
  ListPaymentHistoryUseCase,
  ListOverduePaymentsUseCase,
} from '../../application/use-cases/payments';

// Use Cases - Alert Config
import { GetAlertConfigUseCase } from '../../application/use-cases/alert-config/get-alert-config.use-case';
import { UpsertAlertConfigUseCase } from '../../application/use-cases/alert-config/upsert-alert-config.use-case';

import {
  ListInteriorProjectsUseCase,
  GetInteriorProjectByIdUseCase,
  CreateInteriorProjectUseCase,
  UpdateInteriorProjectUseCase,
} from '../../application/use-cases/interior-projects';

import {
  CreateInteriorLineItemSupplierPaymentUseCase,
  CreateInteriorProjectBudgetLineItemUseCase,
  CreateInteriorProjectBudgetSectionUseCase,
  DeleteInteriorLineItemSupplierPaymentUseCase,
  DeleteInteriorProjectBudgetLineItemUseCase,
  DeleteInteriorProjectBudgetSectionUseCase,
  GetInteriorProjectBudgetUseCase,
  GetInteriorProjectSettlementUseCase,
  RenderInteriorProjectBudgetHtmlUseCase,
  UpdateInteriorProjectBudgetLineItemUseCase,
  UpdateInteriorProjectBudgetSectionUseCase,
  DuplicateInteriorProjectBudgetSnapshotUseCase,
  SyncInteriorProjectBudgetFromExecutionUseCase,
  ImportInteriorProjectBudgetFromExcelUseCase,
  ListInteriorProjectBudgetAttachmentsUseCase,
  UploadInteriorProjectBudgetAttachmentUseCase,
  DeleteInteriorProjectBudgetAttachmentUseCase,
} from '../../application/use-cases/interior-project-budget';

import {
  CreateInteriorCatalogMaterialUseCase,
  DeleteInteriorCatalogMaterialUseCase,
  GetInteriorCatalogMaterialByIdUseCase,
  ListInteriorCatalogMaterialsUseCase,
  UpdateInteriorCatalogMaterialUseCase,
} from '../../application/use-cases/interior-catalog-materials';

import {
  CreateProduccionFurnitureUseCase,
  DeleteProduccionFurnitureUseCase,
  GetProduccionFurnitureByIdUseCase,
  GetProduccionFurnitureStatsUseCase,
  ListProduccionFurnitureUseCase,
  UpdateProduccionFurnitureUseCase,
} from '../../application/use-cases/produccion-furniture';

import {
  CreateProduccionLaborRateUseCase,
  DeleteProduccionLaborRateUseCase,
  GetProduccionLaborRateByIdUseCase,
  ListProduccionLaborRatesUseCase,
  UpdateProduccionLaborRateUseCase,
} from '../../application/use-cases/produccion-labor-rates';

import {
  CreateProduccionExtraCostCatalogUseCase,
  DeleteProduccionExtraCostCatalogUseCase,
  GetProduccionExtraCostCatalogByIdUseCase,
  ListProduccionExtraCostCatalogUseCase,
  UpdateProduccionExtraCostCatalogUseCase,
} from '../../application/use-cases/produccion-extra-cost-catalog';

import {
  CreateProduccionFurnitureCostingSnapshotUseCase,
  GetProduccionFurnitureCostingUseCase,
  ListProduccionFurnitureCostingSnapshotsUseCase,
  UpdateProduccionFurnitureCostingUseCase,
} from '../../application/use-cases/produccion-furniture-costing';

import {
  CreateProduccionMaterialUseCase,
  CreateProduccionStockMovementUseCase,
  DeleteProduccionMaterialUseCase,
  GetProduccionInventoryStatsUseCase,
  GetProduccionMaterialByIdUseCase,
  ListProduccionMaterialsUseCase,
  ListProduccionStockMovementsUseCase,
  UpdateProduccionMaterialUseCase,
} from '../../application/use-cases/produccion-materials';

import {
  CancelProduccionPurchaseOrderUseCase,
  CreateProduccionPurchaseOrderUseCase,
  DeleteProduccionPurchaseOrderUseCase,
  GetProduccionPurchaseOrderByIdUseCase,
  ListProduccionPurchaseOrdersUseCase,
  ReceiveProduccionPurchaseOrderUseCase,
  SendProduccionPurchaseOrderUseCase,
  UpdateProduccionPurchaseOrderUseCase,
} from '../../application/use-cases/produccion-purchase-orders';

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
} from '../../application/use-cases/produccion-work-orders';

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
  RenderProduccionQuotationHtmlUseCase,
} from '../../application/use-cases/produccion-sales';

import { GetProduccionReportsDashboardUseCase } from '../../application/use-cases/produccion-reports';

import {
  CreateProduccionSupplierUseCase,
  DeleteProduccionSupplierUseCase,
  GetProduccionSupplierByIdUseCase,
  LinkProduccionSupplierMaterialUseCase,
  ListProduccionSuppliersUseCase,
  UnlinkProduccionSupplierMaterialUseCase,
  UpdateProduccionSupplierUseCase,
} from '../../application/use-cases/produccion-suppliers';

import {
  CreateInteriorMaterialSupplierUseCase,
  DeleteInteriorMaterialSupplierUseCase,
  GetInteriorMaterialSupplierByIdUseCase,
  LinkInteriorSupplierCatalogMaterialUseCase,
  ListInteriorMaterialSuppliersUseCase,
  RecordInteriorMaterialPurchaseUseCase,
  UnlinkInteriorSupplierCatalogMaterialUseCase,
  UpdateInteriorMaterialSupplierUseCase,
} from '../../application/use-cases/interior-material-suppliers';

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
} from '../../application/use-cases/interior-execution';
import {
  CreateInteriorFinancePaymentUseCase,
  CreateInteriorFinanceScheduleUseCase,
  DeleteInteriorFinancePaymentUseCase,
  DeleteInteriorFinanceScheduleUseCase,
  GetInteriorFinanceOverviewUseCase,
  UpdateInteriorFinancePaymentUseCase,
  UpdateInteriorFinanceScheduleUseCase,
} from '../../application/use-cases/interior-finance';
import {
  CreateInteriorCalendarEventUseCase,
  DeleteInteriorCalendarEventUseCase,
  GetInteriorCalendarFeedUseCase,
  UpdateInteriorCalendarEventUseCase,
} from '../../application/use-cases/interior-calendar';
import { GetInteriorReportsDashboardUseCase } from '../../application/use-cases/interior-reports';
import {
  CreateInteriorProjectDocumentUseCase,
  DeleteInteriorProjectDocumentUseCase,
  ListInteriorProjectDocumentsUseCase,
  UpdateInteriorProjectDocumentUseCase,
} from '../../application/use-cases/interior-project-documents';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { ApplicationsController } from './controllers/applications.controller';
import { UsersController } from './controllers/users.controller';
import { RolesController } from './controllers/roles.controller';
import { MenusController } from './controllers/menus.controller';
import { ClientsController } from './controllers/clients.controller';
import { PropertiesController } from './controllers/properties.controller';
import { RentalsController } from './controllers/rentals.controller';
import { GenArchivosController } from './controllers/gen-archivos.controller';
import { AgentsController } from './controllers/agents.controller';
import { ReportsController } from './controllers/reports.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { PaymentsController } from './controllers/payments.controller';
import { AlertConfigController } from './controllers/alert-config.controller';
import { VentasSalesController } from './controllers/ventas-sales.controller';
import { VentasFinanzasController } from './controllers/ventas-finanzas.controller';
import { VentasReportsController } from './controllers/ventas-reports.controller';
import { VentasConfigController } from './controllers/ventas-config.controller';
import { InteriorismoConfigController } from './controllers/interiorismo-config.controller';
import { VentasComplianceController } from './controllers/ventas-compliance.controller';
import { InteriorismoProjectsController } from './controllers/interiorismo-projects.controller';
import { InteriorismoProjectBudgetController } from './controllers/interiorismo-project-budget.controller';
import { InteriorismoCatalogMaterialsController } from './controllers/interiorismo-catalog-materials.controller';
import { ProduccionFurnitureController } from './controllers/produccion-furniture.controller';
import { ProduccionLaborRatesController } from './controllers/produccion-labor-rates.controller';
import { ProduccionExtraCostsController } from './controllers/produccion-extra-costs.controller';
import { ProduccionFurnitureCostingController } from './controllers/produccion-furniture-costing.controller';
import { ProduccionMaterialsController } from './controllers/produccion-materials.controller';
import { ProduccionStockMovementsController } from './controllers/produccion-stock-movements.controller';
import { ProduccionSuppliersController } from './controllers/produccion-suppliers.controller';
import { ProduccionPurchaseOrdersController } from './controllers/produccion-purchase-orders.controller';
import { ProduccionWorkOrdersController } from './controllers/produccion-work-orders.controller';
import { ProduccionQuotationsController } from './controllers/produccion-quotations.controller';
import { ProduccionOrdersController } from './controllers/produccion-orders.controller';
import { ProduccionDeliveriesController } from './controllers/produccion-deliveries.controller';
import { ProduccionReportsController } from './controllers/produccion-reports.controller';
import { ProduccionConfigController } from './controllers/produccion-config.controller';
import { ContabilidadConfigController } from './controllers/contabilidad-config.controller';
import { ContabilidadAccountsController } from './controllers/contabilidad-accounts.controller';
import { ContabilidadPeriodsController } from './controllers/contabilidad-periods.controller';
import { InteriorismoMaterialSuppliersController } from './controllers/interiorismo-material-suppliers.controller';
import { InteriorismoExecutionController } from './controllers/interiorismo-execution.controller';
import { InteriorismoFinanceController } from './controllers/interiorismo-finance.controller';
import { InteriorismoDocumentsController } from './controllers/interiorismo-documents.controller';
import { InteriorismoCalendarController } from './controllers/interiorismo-calendar.controller';
import { InteriorismoReportsController } from './controllers/interiorismo-reports.controller';
import {
  VentasSalesOperationsService,
  VentasFinanzasOperationsService,
  VentasReportsOperationsService,
  VentasConfigOperationsService,
  VentasComplianceOperationsService,
  InteriorismoConfigOperationsService,
  ProduccionConfigOperationsService,
  ContabilidadConfigOperationsService,
  ContabilidadAccountOperationsService,
  ContabilidadPeriodOperationsService,
} from '../../application/services';

// Gateways
import { NotificationsGateway } from './gateways/notifications.gateway';

// Services - Notifications
import { NotificationsService, RentalAlertsScheduler } from '../../application/services';

import {
  AGENT_PORT,
  AgentPortImpl,
  AUTH_PORT,
  AuthPortImpl,
  CLIENT_PORT,
  ClientPortImpl,
  PAYMENT_PORT,
  PaymentPortImpl,
  PROPERTY_PORT,
  PropertyPortImpl,
  RENTAL_PORT,
  RentalPortImpl,
} from '../../application/ports';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [
    AuthController,
    ApplicationsController,
    UsersController,
    RolesController,
    MenusController,
    ClientsController,
    PropertiesController,
    RentalsController,
    GenArchivosController,
    AgentsController,
    ReportsController,
    NotificationsController,
    PaymentsController,
    AlertConfigController,
    VentasSalesController,
    VentasFinanzasController,
    VentasReportsController,
    VentasConfigController,
    InteriorismoConfigController,
    VentasComplianceController,
    InteriorismoProjectsController,
    InteriorismoProjectBudgetController,
    InteriorismoCatalogMaterialsController,
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
    ContabilidadConfigController,
    ContabilidadAccountsController,
    ContabilidadPeriodsController,
    InteriorismoMaterialSuppliersController,
    InteriorismoExecutionController,
    InteriorismoFinanceController,
    InteriorismoCalendarController,
    InteriorismoDocumentsController,
    InteriorismoReportsController,
  ],
  providers: [
    { provide: AGENT_PORT, useClass: AgentPortImpl },
    { provide: AUTH_PORT, useClass: AuthPortImpl },
    { provide: CLIENT_PORT, useClass: ClientPortImpl },
    { provide: PAYMENT_PORT, useClass: PaymentPortImpl },
    { provide: PROPERTY_PORT, useClass: PropertyPortImpl },
    { provide: RENTAL_PORT, useClass: RentalPortImpl },

    // Services
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
    {
      provide: TokenService,
      useClass: JwtTokenService,
    },
    {
      provide: MailService,
      useClass: NodemailerMailService,
    },

    // Guards
    JwtAuthGuard,
    WsJwtGuard,

    // Notifications (WebSocket + REST)
    NotificationsGateway,
    NotificationsService,
    RentalAlertsScheduler,
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,

    // Use Cases - Applications
    GetUserApplicationsUseCase,
    GetAllApplicationsUseCase,
    GetApplicationByIdUseCase,
    CreateApplicationUseCase,
    UpdateApplicationUseCase,
    DeleteApplicationUseCase,

    // Use Cases - Menus
    GetMenusByApplicationUseCase,
    GetMenusFlatUseCase,
    CreateMenuUseCase,
    UpdateMenuUseCase,
    DeleteMenuUseCase,

    // Use Cases - Roles
    GetUserRolesUseCase,
    GetAllRolesUseCase,
    GetRoleByIdUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignApplicationToRoleUseCase,
    RevokeApplicationFromRoleUseCase,
    GetApplicationsByRoleUseCase,

    // Use Cases - Users
    GetAllUsersUseCase,
    UpdateUserUseCase,
    ToggleUserActiveUseCase,
    AssignUserRoleUseCase,
    RevokeUserRoleUseCase,

    // Use Cases - Clients
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientStatsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,

    // Use Cases - Properties
    CreatePropertyUseCase,
    GetPropertyByIdUseCase,
    ListPropertiesUseCase,
    GetPropertyStatsUseCase,
    UpdatePropertyUseCase,
    UpdatePropertyListingStatusUseCase,
    DeletePropertyUseCase,

    // Use Cases - Rentals
    CreateRentalUseCase,
    ListRentalsUseCase,
    GetRentalStatsUseCase,
    GetRentalByIdUseCase,
    UpdateRentalUseCase,
    GetRentalFinancialConfigUseCase,
    UpsertRentalFinancialConfigUseCase,
    GetRentalFinancialBreakdownUseCase,
    CancelRentalUseCase,
    CreateAgentUseCase,
    ListAgentsUseCase,
    GetAgentByIdUseCase,
    UpdateAgentUseCase,
    DeleteAgentUseCase,
    GetReportsSummaryUseCase,
    GetContractsExpiringUseCase,
    GetPropertiesWithoutContractUseCase,
    GetActiveClientsReportUseCase,
    GetContractStatusSummaryUseCase,
    GetMonthlyMetricsUseCase,
    GetRentalsByMonthUseCase,
    GetFinancialDistributionReportUseCase,
    // Payments
    GetPaymentStatsUseCase,
    ListPendingPaymentsUseCase,
    RegisterPaymentUseCase,
    ListPaymentHistoryUseCase,
    ListOverduePaymentsUseCase,
    // Alert Config
    GetAlertConfigUseCase,
    UpsertAlertConfigUseCase,
    VentasSalesOperationsService,
    VentasFinanzasOperationsService,
    VentasReportsOperationsService,
    VentasConfigOperationsService,
    VentasComplianceOperationsService,
    InteriorismoConfigOperationsService,
    ProduccionConfigOperationsService,
    ContabilidadConfigOperationsService,
    ContabilidadAccountOperationsService,
    ContabilidadPeriodOperationsService,

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
  exports: [HashService, TokenService, MailService],
})
export class HttpModule {}
