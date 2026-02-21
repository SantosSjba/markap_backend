export type ClientType = 'OWNER' | 'TENANT';

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

export interface UpdateClientData {
  clientType?: ClientType;
  documentTypeId?: string;
  documentNumber?: string;
  fullName?: string;
  legalRepresentativeName?: string | null;
  legalRepresentativePosition?: string | null;
  primaryPhone?: string;
  secondaryPhone?: string | null;
  primaryEmail?: string;
  secondaryEmail?: string | null;
  notes?: string | null;
  address?: {
    addressLine?: string;
    districtId?: string;
    reference?: string | null;
  };
}

export interface ClientDetailData extends ClientData {
  documentType: { id: string; code: string; name: string };
  primaryAddress: {
    id: string;
    addressLine: string;
    districtId: string;
    reference: string | null;
    district: {
      id: string;
      name: string;
      province: { id: string; name: string; department: { id: string; name: string } };
    };
  } | null;
}

export interface ClientListItem {
  id: string;
  fullName: string;
  documentTypeCode: string;
  documentNumber: string;
  primaryPhone: string;
  primaryEmail: string;
  clientType: ClientType;
  isActive: boolean;
  propertiesCount: number;
  contractsCount: number;
}

export interface ListClientsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  clientType?: ClientType;
  isActive?: boolean;
}

export interface ListClientsResult {
  data: ClientListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientStats {
  total: number;
  owners: number;
  tenants: number;
  active: number;
}

export interface ClientRepository {
  create(data: CreateClientData): Promise<ClientData>;
  findById(id: string): Promise<ClientDetailData | null>;
  findMany(filters: ListClientsFilters): Promise<ListClientsResult>;
  getStats(applicationSlug: string): Promise<ClientStats>;
  update(id: string, data: UpdateClientData): Promise<ClientData>;
}

export const CLIENT_REPOSITORY = Symbol('ClientRepository');
