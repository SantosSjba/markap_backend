import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import type { AgentListItem } from '@domain/repositories/agent.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { AGENT_REPOSITORY, APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';

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
