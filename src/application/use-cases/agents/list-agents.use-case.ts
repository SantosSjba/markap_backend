import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ListAgentsResult, ListAgentsFilters } from '@domain/repositories/agent.repository';

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
