import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { AGENT_REPOSITORY } from '../../domain/repositories/agent.repository';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import { AgentPrismaRepository } from './repositories/agent-prisma.repository';
import { ClientPrismaRepository } from './repositories/client-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientPrismaRepository,
    },
    {
      provide: AGENT_REPOSITORY,
      useClass: AgentPrismaRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY, AGENT_REPOSITORY],
})
export class CrmPersistenceModule {}
