import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) throw new EntityNotFoundException('Agent', id);
    await this.agentRepository.softDelete(id);
    return { message: 'Agente eliminado correctamente' };
  }
}
