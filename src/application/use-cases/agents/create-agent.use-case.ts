import { Injectable, Inject } from '@nestjs/common';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';
import type { CreateAgentData } from '../../repositories/agent.repository';

export interface CreateAgentInput {
  applicationId?: string;
  applicationSlug?: string;
  type: 'INTERNAL' | 'EXTERNAL';
  userId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentTypeId?: string | null;
  documentNumber?: string | null;
}

@Injectable()
export class CreateAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: CreateAgentInput) {
    let applicationId = input.applicationId;
    if (!applicationId && input.applicationSlug) {
      const app = await this.applicationRepository.findBySlug(
        input.applicationSlug,
      );
      if (!app) {
        throw new EntityNotFoundException(
          'Application',
          input.applicationSlug,
        );
      }
      applicationId = app.id;
    }
    if (!applicationId) {
      throw new Error('applicationId or applicationSlug is required');
    }
    const data: CreateAgentData = {
      applicationId,
      type: input.type,
      userId: input.userId ?? null,
      fullName: input.fullName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      documentTypeId: input.documentTypeId ?? null,
      documentNumber: input.documentNumber ?? null,
    };
    return this.agentRepository.create(data);
  }
}
