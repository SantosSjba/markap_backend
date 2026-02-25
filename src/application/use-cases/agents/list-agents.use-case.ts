import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type {
  ListAgentsResult,
  ListAgentsFilters,
} from '../../repositories/agent.repository';

@Injectable()
export class ListAgentsUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(filters: ListAgentsFilters): Promise<ListAgentsResult> {
    return this.agentRepository.findMany(filters);
  }
}
