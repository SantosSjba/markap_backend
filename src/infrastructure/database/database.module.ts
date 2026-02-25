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
import { UserRepository } from '../../application/repositories/user.repository';
import { ROLE_REPOSITORY } from '../../application/repositories/role.repository';
import { APPLICATION_REPOSITORY } from '../../application/repositories/application.repository';
import { PasswordResetCodeRepository } from '../../application/repositories/password-reset-code.repository';
import { MenuRepository } from '../../application/repositories/menu.repository';
import { ClientRepository, CLIENT_REPOSITORY } from '../../application/repositories/client.repository';
import { PropertyRepository, PROPERTY_REPOSITORY } from '../../application/repositories/property.repository';
import { RENTAL_REPOSITORY } from '../../application/repositories/rental.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../application/repositories/rental-financial-config.repository';
import { RentalFinancialConfigPrismaRepository } from './prisma/repositories/rental-financial-config-prisma.repository';
import { AGENT_REPOSITORY } from '../../application/repositories/agent.repository';
import { AgentPrismaRepository } from './prisma/repositories/agent-prisma.repository';

import { REPORT_REPOSITORY } from '../../application/repositories/report.repository';
import { ReportPrismaRepository } from './prisma/repositories/report-prisma.repository';
import { NOTIFICATION_REPOSITORY } from '../../application/repositories/notification.repository';
import { NotificationPrismaRepository } from './prisma/repositories/notification-prisma.repository';

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
  ],
})
export class DatabaseModule {}
