import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UserPrismaRepository } from './prisma/repositories/user-prisma.repository';
import { RolePrismaRepository } from './prisma/repositories/role-prisma.repository';
import { ApplicationPrismaRepository } from './prisma/repositories/application-prisma.repository';
import { PasswordResetCodePrismaRepository } from './prisma/repositories/password-reset-code-prisma.repository';
import { MenuPrismaRepository } from './prisma/repositories/menu-prisma.repository';
import { ClientPrismaRepository } from './prisma/repositories/client-prisma.repository';
import { PropertyPrismaRepository } from './prisma/repositories/property-prisma.repository';
import { RentalPrismaRepository } from './prisma/repositories/rental-prisma.repository';
import {
  UserRepository,
  PasswordResetCodeRepository,
  MenuRepository,
} from '@common/constants/injection-tokens';
import { ClientRepository } from '@domain/repositories/client.repository';
import { PropertyRepository } from '@domain/repositories/property.repository';
import { RentalFinancialConfigPrismaRepository } from './prisma/repositories/rental-financial-config-prisma.repository';
import { AgentPrismaRepository } from './prisma/repositories/agent-prisma.repository';
import { ReportPrismaRepository } from './prisma/repositories/report-prisma.repository';
import { NotificationPrismaRepository } from './prisma/repositories/notification-prisma.repository';
import { PaymentPrismaRepository } from './prisma/repositories/payment-prisma.repository';
import { AlertConfigPrismaRepository } from './prisma/repositories/alert-config-prisma.repository';
import { VentasSalesPrismaRepository } from './prisma/repositories/ventas-sales-prisma.repository';
import { VentasFinanzasPrismaRepository } from './prisma/repositories/ventas-finanzas-prisma.repository';
import { VentasReportsPrismaRepository } from './prisma/repositories/ventas-reports-prisma.repository';
import { VentasConfigPrismaRepository } from './prisma/repositories/ventas-config-prisma.repository';
import { InteriorismoConfigPrismaRepository } from './prisma/repositories/interiorismo-config-prisma.repository';
import { VentasCompliancePrismaRepository } from './prisma/repositories/ventas-compliance-prisma.repository';
import { InteriorProjectPrismaRepository } from './prisma/repositories/interior-project-prisma.repository';
import { InteriorProjectBudgetPrismaRepository } from './prisma/repositories/interior-project-budget-prisma.repository';
import { InteriorCatalogMaterialPrismaRepository } from './prisma/repositories/interior-catalog-material-prisma.repository';
import { ProduccionFurniturePrismaRepository } from './prisma/repositories/produccion-furniture-prisma.repository';
import { ProduccionLaborRatePrismaRepository } from './prisma/repositories/produccion-labor-rate-prisma.repository';
import { ProduccionExtraCostCatalogPrismaRepository } from './prisma/repositories/produccion-extra-cost-catalog-prisma.repository';
import { ProduccionFurnitureCostingPrismaRepository } from './prisma/repositories/produccion-furniture-costing-prisma.repository';
import { ProduccionMaterialPrismaRepository } from './prisma/repositories/produccion-material-prisma.repository';
import { ProduccionSupplierPrismaRepository } from './prisma/repositories/produccion-supplier-prisma.repository';
import { ProduccionPurchaseOrderPrismaRepository } from './prisma/repositories/produccion-purchase-order-prisma.repository';
import { ProduccionWorkOrderPrismaRepository } from './prisma/repositories/produccion-work-order-prisma.repository';
import {
  ProduccionDeliveryPrismaRepository,
  ProduccionOrderPrismaRepository,
  ProduccionQuotationPrismaRepository,
} from './prisma/repositories/produccion-sales-prisma.repository';
import { ProduccionReportsPrismaRepository } from './prisma/repositories/produccion-reports-prisma.repository';
import { ProduccionConfigPrismaRepository } from './prisma/repositories/produccion-config-prisma.repository';
import { ContabilidadConfigPrismaRepository } from './prisma/repositories/contabilidad-config-prisma.repository';
import { ContabilidadAccountPrismaRepository } from './prisma/repositories/contabilidad-account-prisma.repository';
import { ContabilidadPeriodPrismaRepository } from './prisma/repositories/contabilidad-period-prisma.repository';
import { ContabilidadJournalPrismaRepository } from './prisma/repositories/contabilidad-journal-prisma.repository';
import { ContabilidadTreasuryPrismaRepository } from './prisma/repositories/contabilidad-treasury-prisma.repository';
import { ContabilidadPurchasesPrismaRepository } from './prisma/repositories/contabilidad-purchases-prisma.repository';
import { ContabilidadSalesPrismaRepository } from './prisma/repositories/contabilidad-sales-prisma.repository';
import { ContabilidadTaxesPrismaRepository } from './prisma/repositories/contabilidad-taxes-prisma.repository';
import { ContabilidadPlePrismaRepository } from './prisma/repositories/contabilidad-ple-prisma.repository';
import { ContabilidadFinancialPrismaRepository } from './prisma/repositories/contabilidad-financial-prisma.repository';
import { ContabilidadReportsPrismaRepository } from './prisma/repositories/contabilidad-reports-prisma.repository';
import { ContabilidadExtensionsPrismaRepository } from './prisma/repositories/contabilidad-extensions-prisma.repository';
import { ContabilidadInventoryPrismaRepository } from './prisma/repositories/contabilidad-inventory-prisma.repository';
import { ContabilidadLegalEntityPrismaRepository } from './prisma/repositories/contabilidad-legal-entity-prisma.repository';
import { ContabilidadAuditPrismaRepository } from './prisma/repositories/contabilidad-audit-prisma.repository';
import { ContabilidadCpePrismaRepository } from './prisma/repositories/contabilidad-cpe-prisma.repository';
import { InteriorMaterialSupplierPrismaRepository } from './prisma/repositories/interior-material-supplier-prisma.repository';
import { InteriorExecutionPrismaRepository } from './prisma/repositories/interior-execution-prisma.repository';
import { InteriorFinancePrismaRepository } from './prisma/repositories/interior-finance-prisma.repository';
import { InteriorCalendarPrismaRepository } from './prisma/repositories/interior-calendar-prisma.repository';
import { InteriorReportsPrismaRepository } from './prisma/repositories/interior-reports-prisma.repository';
import { InteriorProjectDocumentPrismaRepository } from './prisma/repositories/interior-project-document-prisma.repository';
import {
  ROLE_REPOSITORY,
  APPLICATION_REPOSITORY,
  CLIENT_REPOSITORY,
  PROPERTY_REPOSITORY,
  RENTAL_REPOSITORY,
  RENTAL_FINANCIAL_CONFIG_REPOSITORY,
  AGENT_REPOSITORY,
  REPORT_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  PAYMENT_REPOSITORY,
  ALERT_CONFIG_REPOSITORY,
  VENTAS_SALES_REPOSITORY,
  VENTAS_FINANZAS_REPOSITORY,
  VENTAS_REPORTS_REPOSITORY,
  VENTAS_CONFIG_REPOSITORY,
  INTERIORISMO_CONFIG_REPOSITORY,
  VENTAS_COMPLIANCE_REPOSITORY,
  INTERIOR_PROJECT_REPOSITORY,
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  INTERIOR_CATALOG_MATERIAL_REPOSITORY,
  PRODUCCION_FURNITURE_REPOSITORY,
  PRODUCCION_LABOR_RATE_REPOSITORY,
  PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
  PRODUCCION_FURNITURE_COSTING_REPOSITORY,
  PRODUCCION_MATERIAL_REPOSITORY,
  PRODUCCION_SUPPLIER_REPOSITORY,
  PRODUCCION_PURCHASE_ORDER_REPOSITORY,
  PRODUCCION_WORK_ORDER_REPOSITORY,
  PRODUCCION_QUOTATION_REPOSITORY,
  PRODUCCION_ORDER_REPOSITORY,
  PRODUCCION_DELIVERY_REPOSITORY,
  PRODUCCION_REPORTS_REPOSITORY,
  PRODUCCION_CONFIG_REPOSITORY,
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
  INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
  INTERIOR_EXECUTION_REPOSITORY,
  INTERIOR_FINANCE_REPOSITORY,
  INTERIOR_CALENDAR_REPOSITORY,
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  INTERIOR_REPORTS_REPOSITORY,
} from '@common/constants/injection-tokens';

@Module({
  providers: [
    PrismaService,
    {
      provide: UserRepository,
      useClass: UserPrismaRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RolePrismaRepository,
    },
    {
      provide: APPLICATION_REPOSITORY,
      useClass: ApplicationPrismaRepository,
    },
    {
      provide: PasswordResetCodeRepository,
      useClass: PasswordResetCodePrismaRepository,
    },
    {
      provide: MenuRepository,
      useClass: MenuPrismaRepository,
    },
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientPrismaRepository,
    },
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PropertyPrismaRepository,
    },
    {
      provide: RENTAL_REPOSITORY,
      useClass: RentalPrismaRepository,
    },
    {
      provide: RENTAL_FINANCIAL_CONFIG_REPOSITORY,
      useClass: RentalFinancialConfigPrismaRepository,
    },
    {
      provide: AGENT_REPOSITORY,
      useClass: AgentPrismaRepository,
    },
    {
      provide: REPORT_REPOSITORY,
      useClass: ReportPrismaRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationPrismaRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentPrismaRepository,
    },
    {
      provide: ALERT_CONFIG_REPOSITORY,
      useClass: AlertConfigPrismaRepository,
    },
    {
      provide: VENTAS_SALES_REPOSITORY,
      useClass: VentasSalesPrismaRepository,
    },
    {
      provide: VENTAS_FINANZAS_REPOSITORY,
      useClass: VentasFinanzasPrismaRepository,
    },
    {
      provide: VENTAS_REPORTS_REPOSITORY,
      useClass: VentasReportsPrismaRepository,
    },
    {
      provide: VENTAS_CONFIG_REPOSITORY,
      useClass: VentasConfigPrismaRepository,
    },
    {
      provide: INTERIORISMO_CONFIG_REPOSITORY,
      useClass: InteriorismoConfigPrismaRepository,
    },
    {
      provide: VENTAS_COMPLIANCE_REPOSITORY,
      useClass: VentasCompliancePrismaRepository,
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
      provide: PRODUCCION_FURNITURE_REPOSITORY,
      useClass: ProduccionFurniturePrismaRepository,
    },
    {
      provide: PRODUCCION_LABOR_RATE_REPOSITORY,
      useClass: ProduccionLaborRatePrismaRepository,
    },
    {
      provide: PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
      useClass: ProduccionExtraCostCatalogPrismaRepository,
    },
    {
      provide: PRODUCCION_FURNITURE_COSTING_REPOSITORY,
      useClass: ProduccionFurnitureCostingPrismaRepository,
    },
    {
      provide: PRODUCCION_MATERIAL_REPOSITORY,
      useClass: ProduccionMaterialPrismaRepository,
    },
    {
      provide: PRODUCCION_SUPPLIER_REPOSITORY,
      useClass: ProduccionSupplierPrismaRepository,
    },
    {
      provide: PRODUCCION_PURCHASE_ORDER_REPOSITORY,
      useClass: ProduccionPurchaseOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_WORK_ORDER_REPOSITORY,
      useClass: ProduccionWorkOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_ORDER_REPOSITORY,
      useClass: ProduccionOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_QUOTATION_REPOSITORY,
      useClass: ProduccionQuotationPrismaRepository,
    },
    {
      provide: PRODUCCION_DELIVERY_REPOSITORY,
      useClass: ProduccionDeliveryPrismaRepository,
    },
    {
      provide: PRODUCCION_REPORTS_REPOSITORY,
      useClass: ProduccionReportsPrismaRepository,
    },
    {
      provide: PRODUCCION_CONFIG_REPOSITORY,
      useClass: ProduccionConfigPrismaRepository,
    },
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
      inject: [PrismaService, CONTABILIDAD_FINANCIAL_REPOSITORY, CONTABILIDAD_TAXES_REPOSITORY],
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
    PrismaService,
    UserRepository,
    ROLE_REPOSITORY,
    APPLICATION_REPOSITORY,
    PasswordResetCodeRepository,
    MenuRepository,
    CLIENT_REPOSITORY,
    PROPERTY_REPOSITORY,
    RENTAL_REPOSITORY,
    RENTAL_FINANCIAL_CONFIG_REPOSITORY,
    AGENT_REPOSITORY,
    REPORT_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    PAYMENT_REPOSITORY,
    ALERT_CONFIG_REPOSITORY,
    VENTAS_SALES_REPOSITORY,
    VENTAS_FINANZAS_REPOSITORY,
    VENTAS_REPORTS_REPOSITORY,
    VENTAS_CONFIG_REPOSITORY,
    INTERIORISMO_CONFIG_REPOSITORY,
    VENTAS_COMPLIANCE_REPOSITORY,
    INTERIOR_PROJECT_REPOSITORY,
    INTERIOR_PROJECT_BUDGET_REPOSITORY,
    INTERIOR_CATALOG_MATERIAL_REPOSITORY,
    PRODUCCION_FURNITURE_REPOSITORY,
    PRODUCCION_LABOR_RATE_REPOSITORY,
    PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
    PRODUCCION_FURNITURE_COSTING_REPOSITORY,
    PRODUCCION_MATERIAL_REPOSITORY,
    PRODUCCION_SUPPLIER_REPOSITORY,
    PRODUCCION_PURCHASE_ORDER_REPOSITORY,
    PRODUCCION_WORK_ORDER_REPOSITORY,
    PRODUCCION_QUOTATION_REPOSITORY,
    PRODUCCION_ORDER_REPOSITORY,
    PRODUCCION_DELIVERY_REPOSITORY,
    PRODUCCION_REPORTS_REPOSITORY,
    PRODUCCION_CONFIG_REPOSITORY,
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
    INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
    INTERIOR_EXECUTION_REPOSITORY,
    INTERIOR_FINANCE_REPOSITORY,
    INTERIOR_CALENDAR_REPOSITORY,
    INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
    INTERIOR_REPORTS_REPOSITORY,
  ],
})
export class DatabaseModule {}
