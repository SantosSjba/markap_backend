import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UserPrismaRepository } from './prisma/repositories/user-prisma.repository';
import { RolePrismaRepository } from './prisma/repositories/role-prisma.repository';
import { ApplicationPrismaRepository } from './prisma/repositories/application-prisma.repository';
import { UserRepository } from '../../application/repositories/user.repository';
import { ROLE_REPOSITORY } from '../../application/repositories/role.repository';
import { APPLICATION_REPOSITORY } from '../../application/repositories/application.repository';

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
  ],
  exports: [PrismaService, UserRepository, ROLE_REPOSITORY, APPLICATION_REPOSITORY],
})
export class DatabaseModule {}
