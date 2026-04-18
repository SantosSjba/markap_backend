import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { UpdateClientData } from '../../repositories/client.repository';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    id: string,
    data: UpdateClientData,
    expectedApplicationSlug?: string,
  ) {
    const existing = await this.clientRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Client', id);
    }
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(
        existing.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Client', id);
      }
    }

    if (data.assignedAgentId !== undefined && data.assignedAgentId !== null) {
      const agent = await this.agentRepository.findById(data.assignedAgentId);
      if (!agent || agent.applicationId !== existing.applicationId) {
        throw new BadRequestException(
          'El asesor no existe o no pertenece a esta aplicación',
        );
      }
    }

    return this.clientRepository.update(id, data);
  }
}
