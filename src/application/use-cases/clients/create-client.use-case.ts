import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AGENT_REPOSITORY, APPLICATION_REPOSITORY, CLIENT_REPOSITORY } from '@common/constants/injection-tokens';
import type { ClientRepository } from '@domain/repositories/client.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { AgentRepository } from '@domain/repositories/agent.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { Email, Phone } from '@domain/value-objects';
import type { SalesPipelineStatus } from '@domain/repositories/client.repository';
import type { ClientType } from '@domain/entities/client.entity';

export interface CreateClientInput {
  applicationId?: string;
  applicationSlug?: string;
  clientType: ClientType;
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
    } else if (input.clientType === 'TENANT') {
      if (slug !== 'alquileres') {
        throw new BadRequestException(
          'Los inquilinos deben crearse con applicationSlug alquileres',
        );
      }
      if (!input.address) {
        throw new BadRequestException('La dirección es obligatoria');
      }
    } else if (
      input.clientType === 'RESIDENTIAL' ||
      input.clientType === 'CORPORATE'
    ) {
      if (slug !== 'interiorismo') {
        throw new BadRequestException(
          'Los clientes residencial/corporativo se crean con applicationSlug interiorismo',
        );
      }
    } else {
      throw new BadRequestException('Tipo de cliente no válido');
    }

    const salesStatus: SalesPipelineStatus | null =
      input.clientType === 'BUYER' ? input.salesStatus ?? 'PROSPECT' : null;

    const primaryPhone = Phone.create(input.primaryPhone).value;
    const primaryEmail = Email.create(input.primaryEmail).value;
    const secondary = Phone.optional(input.secondaryPhone);

    return this.clientRepository.create({
      applicationId,
      clientType: input.clientType,
      documentTypeId: input.documentTypeId,
      documentNumber: input.documentNumber,
      fullName: input.fullName,
      legalRepresentativeName: input.legalRepresentativeName,
      legalRepresentativePosition: input.legalRepresentativePosition,
      primaryPhone,
      secondaryPhone: secondary ? secondary.value : null,
      primaryEmail,
      secondaryEmail: Email.optional(input.secondaryEmail),
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
