import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { AGENT_REPOSITORY, APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<{ message: string }> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) throw new EntityNotFoundException('Agent', id);
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(agent.applicationId);
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Agent', id);
      }
    }
    await this.agentRepository.softDelete(id);
    return { message: 'Agente eliminado correctamente' };
  }
}
