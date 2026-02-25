import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type { AgentListItem } from '../../repositories/agent.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class GetAgentByIdUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(id: string): Promise<AgentListItem> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new EntityNotFoundException('Agent', id);
    }
    return agent;
  }
}
