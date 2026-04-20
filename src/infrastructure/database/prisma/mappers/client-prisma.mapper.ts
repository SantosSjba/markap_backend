import { Client, ClientDetail, ClientListItem } from '@domain/entities/client.entity';
import type { ClientType, SalesPipelineStatus } from '@domain/entities/client.entity';

type ClientRow = {
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
  salesStatus: string | null;
  leadOrigin: string | null;
  assignedAgentId: string | null;
  isActive: boolean;
};

export class ClientPrismaMapper {
  static toDomain(client: ClientRow): Client {
    return new Client(
      client.id,
      client.applicationId,
      client.clientType as ClientType,
      client.documentTypeId,
      client.documentNumber,
      client.fullName,
      client.legalRepresentativeName,
      client.legalRepresentativePosition,
      client.primaryPhone,
      client.secondaryPhone,
      client.primaryEmail,
      client.secondaryEmail,
      client.notes,
      (client.salesStatus as SalesPipelineStatus | null) ?? null,
      client.leadOrigin,
      client.assignedAgentId,
      client.isActive,
    );
  }

  static toListItem(
    c: ClientRow & {
      documentType: { code: string };
      assignedAgent?: { fullName: string } | null;
    },
    propertiesCount: number,
    contractsCount: number,
  ): ClientListItem {
    return new ClientListItem(
      c.id,
      c.fullName,
      c.documentType.code,
      c.documentNumber,
      c.primaryPhone,
      c.primaryEmail,
      c.clientType as ClientType,
      c.isActive,
      propertiesCount,
      contractsCount,
      (c.salesStatus as SalesPipelineStatus | null) ?? null,
      c.leadOrigin,
      c.assignedAgent?.fullName ?? null,
    );
  }

  static toDetail(
    client: ClientRow,
    applicationSlug: string,
    documentType: { id: string; code: string; name: string },
    primaryAddress: ClientDetail['primaryAddress'],
    assignedAgent: ClientDetail['assignedAgent'],
  ): ClientDetail {
    return new ClientDetail(
      ClientPrismaMapper.toDomain(client),
      applicationSlug,
      documentType,
      primaryAddress,
      assignedAgent,
    );
  }
}
