import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ClientRepository } from '@domain/repositories/client.repository';
import type { UpdateClientData } from '@domain/repositories/client.repository';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { AGENT_REPOSITORY, APPLICATION_REPOSITORY, CLIENT_REPOSITORY, PROPERTY_REPOSITORY } from '@common/constants/injection-tokens';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
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

    const app = await this.applicationRepository.findById(existing.applicationId);
    const isVentas = app?.slug === 'ventas';
    if (
      isVentas &&
      data.clientType === 'BUYER' &&
      existing.clientType === 'OWNER'
    ) {
      const props = await this.propertyRepository.countActiveByOwnerId(
        id,
        existing.applicationId,
      );
      if (props > 0) {
        throw new BadRequestException(
          'No se puede cambiar a comprador / lead mientras el cliente siga como titular de propiedades en inventario.',
        );
      }
    }

    return this.clientRepository.update(id, data);
  }
}
