import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type { UpdateAgentData } from '../../repositories/agent.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface UpdateAgentInput extends UpdateAgentData {}

@Injectable()
export class UpdateAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    id: string,
    data: UpdateAgentInput,
    expectedApplicationSlug?: string,
  ) {
    const existing = await this.agentRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Agent', id);
    }
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(
        existing.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Agent', id);
      }
    }
    return this.agentRepository.update(id, {
      type: data.type,
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      documentTypeId: data.documentTypeId,
      documentNumber: data.documentNumber,
      isActive: data.isActive,
    });
  }
}
