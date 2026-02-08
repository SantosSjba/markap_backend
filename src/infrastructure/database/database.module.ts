import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UserPrismaRepository } from './prisma/repositories/user-prisma.repository';
import { RolePrismaRepository } from './prisma/repositories/role-prisma.repository';
import { ApplicationPrismaRepository } from './prisma/repositories/application-prisma.repository';
import { PasswordResetCodePrismaRepository } from './prisma/repositories/password-reset-code-prisma.repository';
import { MenuPrismaRepository } from './prisma/repositories/menu-prisma.repository';
import { UserRepository } from '../../application/repositories/user.repository';
import { ROLE_REPOSITORY } from '../../application/repositories/role.repository';
import { APPLICATION_REPOSITORY } from '../../application/repositories/application.repository';
import { PasswordResetCodeRepository } from '../../application/repositories/password-reset-code.repository';
import { MenuRepository } from '../../application/repositories/menu.repository';

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
  ],
  exports: [
    PrismaService,
    UserRepository,
    ROLE_REPOSITORY,
    APPLICATION_REPOSITORY,
    PasswordResetCodeRepository,
    MenuRepository,
  ],
})
export class DatabaseModule {}
