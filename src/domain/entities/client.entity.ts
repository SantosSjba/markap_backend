export type ClientType =
  | 'OWNER'
  | 'TENANT'
  | 'BUYER'
  | 'RESIDENTIAL'
  | 'CORPORATE';
export type SalesPipelineStatus = 'PROSPECT' | 'INTERESTED' | 'CLIENT';

/** Cliente (propietario, inquilino o lead de ventas). */
export class Client {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly clientType: ClientType,
    public readonly documentTypeId: string,
    public readonly documentNumber: string,
    public readonly fullName: string,
    public readonly legalRepresentativeName: string | null,
    public readonly legalRepresentativePosition: string | null,
    public readonly primaryPhone: string,
    public readonly secondaryPhone: string | null,
    public readonly primaryEmail: string,
    public readonly secondaryEmail: string | null,
    public readonly notes: string | null,
    public readonly salesStatus: SalesPipelineStatus | null,
    public readonly leadOrigin: string | null,
    public readonly assignedAgentId: string | null,
    public readonly isActive: boolean,
  ) {}
}

/** Fila de listado de clientes. */
export class ClientListItem {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly documentTypeCode: string,
    public readonly documentNumber: string,
    public readonly primaryPhone: string,
    public readonly primaryEmail: string,
    public readonly clientType: ClientType,
    public readonly isActive: boolean,
    public readonly propertiesCount: number,
    public readonly contractsCount: number,
    public readonly salesStatus: SalesPipelineStatus | null,
    public readonly leadOrigin: string | null,
    public readonly assignedAgentName: string | null,
  ) {}
}

/** Detalle de cliente con dirección fiscal y agente. */
export class ClientDetail extends Client {
  constructor(
    client: Client,
    public readonly applicationSlug: string,
    public readonly documentType: { id: string; code: string; name: string },
    public readonly primaryAddress: {
      id: string;
      addressLine: string;
      districtId: string;
      reference: string | null;
      district: {
        id: string;
        name: string;
        province: { id: string; name: string; department: { id: string; name: string } };
      };
    } | null,
    public readonly assignedAgent: { id: string; fullName: string } | null,
  ) {
    super(
      client.id,
      client.applicationId,
      client.clientType,
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
      client.salesStatus,
      client.leadOrigin,
      client.assignedAgentId,
      client.isActive,
    );
  }
}
