import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { AgentRepository } from '../../../domain/repositories/agent.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';

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
      const app = await this.applicationRepository.findById(
        agent.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Agent', id);
      }
    }
    await this.agentRepository.softDelete(id);
    return { message: 'Agente eliminado correctamente' };
  }
}
