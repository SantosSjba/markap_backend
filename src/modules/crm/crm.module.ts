import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { AgentFacade } from './application/facades/agent.facade';
import { ClientFacade } from './application/facades/client.facade';
import { AGENT_PORT } from './application/ports/agent.port';
import { CLIENT_PORT } from './application/ports/client.port';
import { CreateAgentUseCase } from './application/use-cases/agents/create-agent.use-case';
import { DeleteAgentUseCase } from './application/use-cases/agents/delete-agent.use-case';
import { GetAgentByIdUseCase } from './application/use-cases/agents/get-agent-by-id.use-case';
import { ListAgentsUseCase } from './application/use-cases/agents/list-agents.use-case';
import { UpdateAgentUseCase } from './application/use-cases/agents/update-agent.use-case';
import { CreateClientUseCase } from './application/use-cases/clients/create-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/clients/delete-client.use-case';
import { GetClientByIdUseCase } from './application/use-cases/clients/get-client-by-id.use-case';
import {
  GetClientStatsUseCase,
  ListClientsUseCase,
} from './application/use-cases/clients/list-clients.use-case';
import { UpdateClientUseCase } from './application/use-cases/clients/update-client.use-case';
import { AgentsController } from './presentation/controllers/agents.controller';
import { ClientsController } from './presentation/controllers/clients.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [ClientsController, AgentsController],
  providers: [
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientStatsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    CreateAgentUseCase,
    ListAgentsUseCase,
    GetAgentByIdUseCase,
    UpdateAgentUseCase,
    DeleteAgentUseCase,
    { provide: AGENT_PORT, useClass: AgentFacade },
    { provide: CLIENT_PORT, useClass: ClientFacade },
  ],
  exports: [],
})
export class CrmModule {}
