import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type { AgentListItem } from '../../repositories/agent.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface GetAgentByIdOptions {
  /** Si se indica, el agente debe pertenecer a esta aplicación (por slug) */
  applicationSlug?: string;
}

@Injectable()
export class GetAgentByIdUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    id: string,
    options?: GetAgentByIdOptions,
  ): Promise<AgentListItem> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new EntityNotFoundException('Agent', id);
    }
    if (options?.applicationSlug?.trim()) {
      const app = await this.applicationRepository.findBySlug(
        options.applicationSlug.trim(),
      );
      if (!app) {
        throw new EntityNotFoundException(
          'Application',
          options.applicationSlug.trim(),
        );
      }
      if (agent.applicationId !== app.id) {
        throw new EntityNotFoundException('Agent', id);
      }
    }
    return agent;
  }
}
