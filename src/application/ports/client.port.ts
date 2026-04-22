import type {
  ListClientsFilters,
  ListClientsResult,
  ClientStats,
  UpdateClientData,
} from '@domain/repositories/client.repository';
import type { CreateClientInput } from '../use-cases/clients/create-client.use-case';

export const CLIENT_PORT = Symbol('ClientPort');

export interface ClientPort {
  listClients(filters: ListClientsFilters): Promise<ListClientsResult>;
  getClientStats(applicationSlug: string): Promise<ClientStats>;
  createClient(input: CreateClientInput): Promise<unknown>;
  getClientById(id: string, applicationSlug?: string): Promise<unknown>;
  updateClient(
    id: string,
    data: UpdateClientData,
    applicationSlug?: string,
  ): Promise<unknown>;
  deleteClient(id: string, applicationSlug?: string): Promise<unknown>;
}
