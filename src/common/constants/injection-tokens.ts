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
export { VENTAS_FINANZAS_REPOSITORY } from '@domain/repositories/ventas-finanzas.repository';
export { VENTAS_REPORTS_REPOSITORY } from '@domain/repositories/ventas-reports.repository';
export { VENTAS_SALES_REPOSITORY } from '@domain/repositories/ventas-sales.repository';

export { HashService } from '@domain/services/hash.service';
export { TokenService } from '@domain/services/token.service';
export { MailService } from '@domain/services/mail.service';
