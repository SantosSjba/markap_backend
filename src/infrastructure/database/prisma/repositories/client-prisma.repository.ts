import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  ClientRepository,
  ClientData,
  CreateClientData,
} from '../../../../application/repositories/client.repository';

@Injectable()
export class ClientPrismaRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData): Promise<ClientData> {
    const client = await this.prisma.client.create({
      data: {
        applicationId: data.applicationId,
        clientType: data.clientType,
        documentTypeId: data.documentTypeId,
        documentNumber: data.documentNumber.trim(),
        fullName: data.fullName.trim(),
        legalRepresentativeName: data.legalRepresentativeName?.trim() || null,
        legalRepresentativePosition:
          data.legalRepresentativePosition?.trim() || null,
        primaryPhone: data.primaryPhone.trim(),
        secondaryPhone: data.secondaryPhone?.trim() || null,
        primaryEmail: data.primaryEmail.trim(),
        secondaryEmail: data.secondaryEmail?.trim() || null,
        notes: data.notes?.trim() || null,
        addresses: {
          create: {
            addressType: 'FISCAL',
            addressLine: data.address.addressLine.trim(),
            districtId: data.address.districtId,
            reference: data.address.reference?.trim() || null,
            isPrimary: true,
          },
        },
      },
      include: {
        documentType: true,
        addresses: { include: { district: { include: { province: true } } } },
      },
    });
    return this.toClientData(client);
  }

  private toClientData(client: {
    id: string;
    applicationId: string;
    clientType: string;
    documentTypeId: string;
    documentNumber: string;
    fullName: string;
    legalRepresentativeName: string | null;
    legalRepresentativePosition: string | null;
    primaryPhone: string;
    secondaryPhone: string | null;
    primaryEmail: string;
    secondaryEmail: string | null;
    notes: string | null;
    isActive: boolean;
  }): ClientData {
    return {
      id: client.id,
      applicationId: client.applicationId,
      clientType: client.clientType as 'OWNER' | 'TENANT' | 'BOTH',
      documentTypeId: client.documentTypeId,
      documentNumber: client.documentNumber,
      fullName: client.fullName,
      legalRepresentativeName: client.legalRepresentativeName,
      legalRepresentativePosition: client.legalRepresentativePosition,
      primaryPhone: client.primaryPhone,
      secondaryPhone: client.secondaryPhone,
      primaryEmail: client.primaryEmail,
      secondaryEmail: client.secondaryEmail,
      notes: client.notes,
      isActive: client.isActive,
    };
  }
}
