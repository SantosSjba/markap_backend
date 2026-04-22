import { Injectable, Inject } from '@nestjs/common';
import { AGENT_REPOSITORY, APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import type { UpdateAgentData } from '@domain/repositories/agent.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { Email, Phone } from '@domain/value-objects';

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
      email:
        data.email === undefined
          ? undefined
          : data.email == null || !String(data.email).trim()
            ? null
            : Email.create(String(data.email)).value,
      phone:
        data.phone === undefined
          ? undefined
          : data.phone == null || !String(data.phone).trim()
            ? null
            : Phone.create(String(data.phone)).value,
      documentTypeId: data.documentTypeId,
      documentNumber: data.documentNumber,
      isActive: data.isActive,
    });
  }
}
