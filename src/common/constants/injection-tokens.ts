/**
 * Barra central de **tokens** para inyección en NestJS.
 * - `Symbol` de repositorios: reexportados desde `@domain/repositories/*`.
 * - Repositorios con **clase abstracta** como token (`UserRepository`, `MenuRepository`, …):
 *   misma idea: un solo import en casos de uso y módulos.
 * - Servicios de dominio (`HashService`, `TokenService`, `MailService`): clase abstracta
 *   (`provide: HashService, useClass: BcryptHashService`).
 */

export { UserRepository } from '@domain/repositories/user.repository';
export { MenuRepository } from '@domain/repositories/menu.repository';
export { PasswordResetCodeRepository } from '@domain/repositories/password-reset-code.repository';

export { AGENT_REPOSITORY } from '@domain/repositories/agent.repository';
export { ALERT_CONFIG_REPOSITORY } from '@domain/repositories/alert-config.repository';
export { APPLICATION_REPOSITORY } from '@domain/repositories/application.repository';
export { CLIENT_REPOSITORY } from '@domain/repositories/client.repository';
export { NOTIFICATION_REPOSITORY } from '@domain/repositories/notification.repository';
export { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
export { PROPERTY_REPOSITORY } from '@domain/repositories/property.repository';
export { RENTAL_REPOSITORY } from '@domain/repositories/rental.repository';
export { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '@domain/repositories/rental-financial-config.repository';
export { REPORT_REPOSITORY } from '@domain/repositories/report.repository';
export { ROLE_REPOSITORY } from '@domain/repositories/role.repository';
export { VENTAS_CONFIG_REPOSITORY } from '@domain/repositories/ventas-config.repository';
export { INTERIORISMO_CONFIG_REPOSITORY } from '@domain/repositories/interiorismo-config.repository';
export { VENTAS_COMPLIANCE_REPOSITORY } from '@domain/repositories/ventas-compliance.repository';
export { VENTAS_FINANZAS_REPOSITORY } from '@domain/repositories/ventas-finanzas.repository';
export { VENTAS_REPORTS_REPOSITORY } from '@domain/repositories/ventas-reports.repository';
export { VENTAS_SALES_REPOSITORY } from '@domain/repositories/ventas-sales.repository';
export { INTERIOR_PROJECT_REPOSITORY } from '@domain/repositories/interior-project.repository';
export { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/interior-project-budget.repository';
export { INTERIOR_CATALOG_MATERIAL_REPOSITORY } from '@domain/repositories/interior-catalog-material.repository';
export { PRODUCCION_FURNITURE_REPOSITORY } from '@domain/repositories/produccion-furniture.repository';
export { PRODUCCION_LABOR_RATE_REPOSITORY } from '@domain/repositories/produccion-labor-rate.repository';
export { PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY } from '@domain/repositories/produccion-extra-cost-catalog.repository';
export { PRODUCCION_FURNITURE_COSTING_REPOSITORY } from '@domain/repositories/produccion-furniture-costing.repository';
export { PRODUCCION_MATERIAL_REPOSITORY } from '@domain/repositories/produccion-material.repository';
export { PRODUCCION_SUPPLIER_REPOSITORY } from '@domain/repositories/produccion-supplier.repository';
export { PRODUCCION_PURCHASE_ORDER_REPOSITORY } from '@domain/repositories/produccion-purchase-order.repository';
export { PRODUCCION_WORK_ORDER_REPOSITORY } from '@domain/repositories/produccion-work-order.repository';
export {
  PRODUCCION_QUOTATION_REPOSITORY,
  PRODUCCION_ORDER_REPOSITORY,
  PRODUCCION_DELIVERY_REPOSITORY,
} from '@domain/repositories/produccion-sales.repository';
export { PRODUCCION_REPORTS_REPOSITORY } from '@domain/repositories/produccion-reports.repository';
export { PRODUCCION_CONFIG_REPOSITORY } from '@domain/repositories/produccion-config.repository';
export { CONTABILIDAD_CONFIG_REPOSITORY } from '@domain/repositories/contabilidad-config.repository';
export { CONTABILIDAD_ACCOUNT_REPOSITORY } from '@domain/repositories/contabilidad-account.repository';
export { CONTABILIDAD_PERIOD_REPOSITORY } from '@domain/repositories/contabilidad-period.repository';
export { CONTABILIDAD_JOURNAL_REPOSITORY } from '@domain/repositories/contabilidad-journal.repository';
export { CONTABILIDAD_TREASURY_REPOSITORY } from '@domain/repositories/contabilidad-treasury.repository';
export { CONTABILIDAD_PURCHASES_REPOSITORY } from '@domain/repositories/contabilidad-purchases.repository';
export { CONTABILIDAD_SALES_REPOSITORY } from '@domain/repositories/contabilidad-sales.repository';
export { CONTABILIDAD_TAXES_REPOSITORY } from '@domain/repositories/contabilidad-taxes.repository';
export { CONTABILIDAD_PLE_REPOSITORY } from '@domain/repositories/contabilidad-ple.repository';
export { CONTABILIDAD_FINANCIAL_REPOSITORY } from '@domain/repositories/contabilidad-financial.repository';
export { INTERIOR_MATERIAL_SUPPLIER_REPOSITORY } from '@domain/repositories/interior-material-supplier.repository';
export { INTERIOR_EXECUTION_REPOSITORY } from '@domain/repositories/interior-execution.repository';
export { INTERIOR_FINANCE_REPOSITORY } from '@domain/repositories/interior-finance.repository';
export { INTERIOR_CALENDAR_REPOSITORY } from '@domain/repositories/interior-calendar.repository';
export { INTERIOR_REPORTS_REPOSITORY } from '@domain/repositories/interior-reports.repository';
export { INTERIOR_PROJECT_DOCUMENT_REPOSITORY } from '@domain/repositories/interior-project-document.repository';

export { HashService } from '@domain/services/hash.service';
export { TokenService } from '@domain/services/token.service';
export { MailService } from '@domain/services/mail.service';
