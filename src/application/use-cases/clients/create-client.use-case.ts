import { Injectable, Inject } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface CreateClientInput {
  applicationId?: string;
  applicationSlug?: string;
  clientType: 'OWNER' | 'TENANT';
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
  address: {
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
  ) {}

  async execute(input: CreateClientInput) {
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
      throw new Error('applicationId or applicationSlug is required');
    }
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
      address: input.address,
    });
  }
}
