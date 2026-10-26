import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { APPLICATION_REPOSITORY } from '../../domain/repositories/application.repository';
import { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ApplicationPrismaRepository } from './repositories/application-prisma.repository';
import { PasswordResetCodePrismaRepository } from './repositories/password-reset-code-prisma.repository';
import { RolePrismaRepository } from './repositories/role-prisma.repository';
import { UserPrismaRepository } from './repositories/user-prisma.repository';
import { ApplicationAccessRepository } from '../../domain/repositories/application-access.repository';
import { ApplicationAccessPrismaRepository } from './repositories/application-access-prisma.repository';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogPrismaRepository } from './repositories/audit-log-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    { provide: AuditLogRepository, useClass: AuditLogPrismaRepository },
    {
      provide: ApplicationAccessRepository,
      useClass: ApplicationAccessPrismaRepository,
    },
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
  ],
  exports: [
    AuditLogRepository,
    ApplicationAccessRepository,
    UserRepository,
    ROLE_REPOSITORY,
    APPLICATION_REPOSITORY,
    PasswordResetCodeRepository,
  ],
})
export class IdentityPersistenceModule {}
