import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { APPLICATION_REPOSITORY } from '../../domain/repositories/application.repository';
import { MenuRepository } from '../../domain/repositories/menu.repository';
import { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ApplicationPrismaRepository } from './repositories/application-prisma.repository';
import { MenuPrismaRepository } from './repositories/menu-prisma.repository';
import { PasswordResetCodePrismaRepository } from './repositories/password-reset-code-prisma.repository';
import { RolePrismaRepository } from './repositories/role-prisma.repository';
import { UserPrismaRepository } from './repositories/user-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
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
  ],
  exports: [
    UserRepository,
    ROLE_REPOSITORY,
    APPLICATION_REPOSITORY,
    PasswordResetCodeRepository,
    MenuRepository,
  ],
})
export class IdentityPersistenceModule {}
