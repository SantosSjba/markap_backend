import { Injectable } from '@nestjs/common';
import type {
  ClientStats,
  ListClientsFilters,
  ListClientsResult,
  UpdateClientData,
} from '../../domain/repositories/client.repository';
import type { ClientPort } from '../ports/client.port';
import type { CreateClientInput } from '../use-cases/clients/create-client.use-case';
import { CreateClientUseCase } from '../use-cases/clients/create-client.use-case';
import { DeleteClientUseCase } from '../use-cases/clients/delete-client.use-case';
import { GetClientByIdUseCase } from '../use-cases/clients/get-client-by-id.use-case';
import {
  GetClientStatsUseCase,
  ListClientsUseCase,
} from '../use-cases/clients/list-clients.use-case';
import { UpdateClientUseCase } from '../use-cases/clients/update-client.use-case';

@Injectable()
export class ClientFacade implements ClientPort {
  constructor(
    private readonly createUc: CreateClientUseCase,
    private readonly listUc: ListClientsUseCase,
    private readonly statsUc: GetClientStatsUseCase,
    private readonly getByIdUc: GetClientByIdUseCase,
    private readonly updateUc: UpdateClientUseCase,
    private readonly deleteUc: DeleteClientUseCase,
  ) {}

  listClients(filters: ListClientsFilters): Promise<ListClientsResult> {
    return this.listUc.execute(filters);
  }

  getClientStats(applicationSlug: string): Promise<ClientStats> {
    return this.statsUc.execute(applicationSlug);
  }

  createClient(input: CreateClientInput) {
    return this.createUc.execute(input);
  }

  getClientById(id: string, applicationSlug?: string) {
    return this.getByIdUc.execute(id, applicationSlug);
  }

  updateClient(id: string, data: UpdateClientData, applicationSlug?: string) {
    return this.updateUc.execute(id, data, applicationSlug);
  }

  deleteClient(id: string, applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug);
  }
}
