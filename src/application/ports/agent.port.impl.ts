import { Injectable } from '@nestjs/common';
import type { ListAgentsFilters, ListAgentsResult, AgentListItem } from '@domain/repositories/agent.repository';
import type { CreateAgentInput } from '../use-cases/agents/create-agent.use-case';
import { CreateAgentUseCase } from '../use-cases/agents/create-agent.use-case';
import { ListAgentsUseCase } from '../use-cases/agents/list-agents.use-case';
import { GetAgentByIdUseCase } from '../use-cases/agents/get-agent-by-id.use-case';
import { UpdateAgentUseCase, type UpdateAgentInput } from '../use-cases/agents/update-agent.use-case';
import { DeleteAgentUseCase } from '../use-cases/agents/delete-agent.use-case';
import type { AgentPort } from './agent.port';

@Injectable()
export class AgentPortImpl implements AgentPort {
  constructor(
    private readonly createAgentUc: CreateAgentUseCase,
    private readonly listAgentsUc: ListAgentsUseCase,
    private readonly getByIdUc: GetAgentByIdUseCase,
    private readonly updateAgentUc: UpdateAgentUseCase,
    private readonly deleteAgentUc: DeleteAgentUseCase,
  ) {}

  listAgents(filters: ListAgentsFilters): Promise<ListAgentsResult> {
    return this.listAgentsUc.execute(filters);
  }

  createAgent(input: CreateAgentInput) {
    return this.createAgentUc.execute(input);
  }

  getAgentById(
    id: string,
    opts?: { applicationSlug?: string },
  ): Promise<AgentListItem> {
    return this.getByIdUc.execute(id, opts);
  }

  updateAgent(
    id: string,
    data: UpdateAgentInput,
    applicationSlug?: string,
  ) {
    return this.updateAgentUc.execute(id, data, applicationSlug);
  }

  deleteAgent(id: string, applicationSlug?: string) {
    return this.deleteAgentUc.execute(id, applicationSlug);
  }
}
