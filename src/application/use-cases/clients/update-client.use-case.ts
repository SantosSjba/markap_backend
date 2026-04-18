import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { UpdateClientData } from '../../repositories/client.repository';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(id: string, data: UpdateClientData) {
    const existing = await this.clientRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Client', id);
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
