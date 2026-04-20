import type { Client, ClientDetail, ClientListItem, ClientType, SalesPipelineStatus } from '../entities/client.entity';

export type { Client, ClientDetail, ClientListItem, ClientType, SalesPipelineStatus } from '../entities/client.entity';

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
  salesStatus?: SalesPipelineStatus | null;
  leadOrigin?: string | null;
  assignedAgentId?: string | null;
  address?: {
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
  salesStatus?: SalesPipelineStatus | null;
  leadOrigin?: string | null;
  assignedAgentId?: string | null;
  address?: {
    addressLine?: string;
    districtId?: string;
    reference?: string | null;
  };
}

export interface ListClientsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  clientType?: ClientType;
  salesStatus?: SalesPipelineStatus;
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
  prospects?: number;
  interested?: number;
  salesClients?: number;
}

export interface ClientRepository {
  create(data: CreateClientData): Promise<Client>;
  findById(id: string): Promise<ClientDetail | null>;
  findMany(filters: ListClientsFilters): Promise<ListClientsResult>;
  getStats(applicationSlug: string): Promise<ClientStats>;
  update(id: string, data: UpdateClientData): Promise<Client>;
  softDelete(id: string): Promise<void>;
}

export const CLIENT_REPOSITORY = Symbol('ClientRepository');
