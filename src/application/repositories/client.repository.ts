export type ClientType = 'OWNER' | 'TENANT' | 'BOTH';

export interface ClientData {
  id: string;
  applicationId: string;
  clientType: ClientType;
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
}

export interface AddressData {
  id: string;
  clientId: string;
  addressType: string;
  addressLine: string;
  districtId: string;
  reference: string | null;
  isPrimary: boolean;
}

export interface CreateClientData {
  applicationId: string;
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
  address: {
    addressLine: string;
    districtId: string;
    reference?: string | null;
  };
}

export interface ClientRepository {
  create(data: CreateClientData): Promise<ClientData>;
}

export const CLIENT_REPOSITORY = Symbol('ClientRepository');
