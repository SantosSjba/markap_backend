import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { Email } from '../../../../../shared/domain/value-objects/email.value-object';
import { Phone } from '../../../../../shared/domain/value-objects/phone.value-object';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import type {
  AgentProjectRole,
  AgentRepository,
  CreateAgentData,
} from '../../../domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';

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
  roles?: AgentProjectRole[];
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
        throw new EntityNotFoundException('Application', input.applicationSlug);
      }
      applicationId = app.id;
    }
    if (!applicationId) {
      throw new Error('Falta indicar la aplicación (applicationSlug).');
    }
    const data: CreateAgentData = {
      applicationId,
      type: input.type,
      userId: input.userId ?? null,
      fullName: input.fullName.trim(),
      email: input.email?.trim()
        ? Email.create(String(input.email)).value
        : null,
      phone: input.phone?.trim()
        ? Phone.create(String(input.phone)).value
        : null,
      documentTypeId: input.documentTypeId ?? null,
      documentNumber: input.documentNumber ?? null,
      roles: [...new Set(input.roles ?? [])],
    };
    return this.agentRepository.create(data);
  }
}
