import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { AgentListItem } from '../../../domain/entities/agent.entity';
import type { AgentRepository } from '../../../domain/repositories/agent.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';

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
