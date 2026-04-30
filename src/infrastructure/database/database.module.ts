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
import { VentasCompliancePrismaRepository } from './prisma/repositories/ventas-compliance-prisma.repository';
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
  VENTAS_COMPLIANCE_REPOSITORY,
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
      provide: VENTAS_COMPLIANCE_REPOSITORY,
      useClass: VentasCompliancePrismaRepository,
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
    VENTAS_COMPLIANCE_REPOSITORY,
  ],
})
export class DatabaseModule {}
