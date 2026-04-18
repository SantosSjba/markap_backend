import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import { EntityNotFoundException } from '../../exceptions';
import type { SalesPipelineStatus } from '../../repositories/client.repository';

export interface CreateClientInput {
  applicationId?: string;
  applicationSlug?: string;
  clientType: 'OWNER' | 'TENANT' | 'BUYER';
  documentTypeId: string;
  documentNumber: string;
  fullName: string;
  legalRepresentativeName?: string | null;
  legalRepresentativePosition?: string | null;
  primaryPhone: string;
  secondaryPhone?: string | null;
  primaryEmail: string;
  secondaryEmail?: string | null;
  notes?: string | null;
  salesStatus?: SalesPipelineStatus | null;
  leadOrigin?: string | null;
  assignedAgentId?: string | null;
  address?: {
    addressLine: string;
    districtId: string;
    reference?: string | null;
  };
}

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  private async assertAgentBelongsToApplication(
    agentId: string,
    applicationId: string,
  ): Promise<void> {
    const agent = await this.agentRepository.findById(agentId);
    if (!agent || agent.applicationId !== applicationId) {
      throw new BadRequestException(
        'El asesor no existe o no pertenece a esta aplicación',
      );
    }
  }

  async execute(input: CreateClientInput) {
    let applicationId = input.applicationId;
    const slug = input.applicationSlug ?? 'alquileres';

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
      throw new BadRequestException('applicationId or applicationSlug is required');
    }

    if (input.clientType === 'BUYER') {
      if (slug !== 'ventas') {
        throw new BadRequestException(
          'Los clientes de ventas (leads) deben crearse con applicationSlug ventas',
        );
      }
      if (input.assignedAgentId) {
        await this.assertAgentBelongsToApplication(
          input.assignedAgentId,
          applicationId,
        );
      }
    } else if (input.clientType === 'OWNER') {
      if (slug !== 'ventas' && slug !== 'alquileres') {
        throw new BadRequestException(
          'Los propietarios se crean con applicationSlug ventas o alquileres',
        );
      }
      if (!input.address) {
        throw new BadRequestException('La dirección es obligatoria');
      }
    } else {
      if (slug !== 'alquileres') {
        throw new BadRequestException(
          'Los inquilinos deben crearse con applicationSlug alquileres',
        );
      }
      if (!input.address) {
        throw new BadRequestException('La dirección es obligatoria');
      }
    }

    const salesStatus: SalesPipelineStatus | null =
      input.clientType === 'BUYER' ? input.salesStatus ?? 'PROSPECT' : null;

    return this.clientRepository.create({
      applicationId,
      clientType: input.clientType,
      documentTypeId: input.documentTypeId,
      documentNumber: input.documentNumber,
      fullName: input.fullName,
      legalRepresentativeName: input.legalRepresentativeName,
      legalRepresentativePosition: input.legalRepresentativePosition,
      primaryPhone: input.primaryPhone,
      secondaryPhone: input.secondaryPhone,
      primaryEmail: input.primaryEmail,
      secondaryEmail: input.secondaryEmail,
      notes: input.notes,
      salesStatus,
      leadOrigin:
        input.clientType === 'BUYER' ? input.leadOrigin?.trim() || null : null,
      assignedAgentId:
        input.clientType === 'BUYER' ? input.assignedAgentId ?? null : null,
      address: input.address,
    });
  }
}
