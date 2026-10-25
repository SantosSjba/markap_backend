import { Inject, Injectable } from '@nestjs/common';
import type {
  AgentRepository,
  ListAgentsFilters,
  ListAgentsResult,
} from '../../../domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';

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
