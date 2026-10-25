import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { Email } from '../../../../../shared/domain/value-objects/email.value-object';
import { Phone } from '../../../../../shared/domain/value-objects/phone.value-object';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import type {
  AgentRepository,
  UpdateAgentData,
} from '../../../domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';

export type UpdateAgentInput = UpdateAgentData;

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
