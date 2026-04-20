import { Injectable, Inject } from '@nestjs/common';
import type { ClientRepository } from '@domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '@domain/repositories/client.repository';
import type {
  ListClientsResult,
  ListClientsFilters,
  ClientStats,
} from '@domain/repositories/client.repository';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(filters: ListClientsFilters): Promise<ListClientsResult> {
    return this.clientRepository.findMany(filters);
  }
}

@Injectable()
export class GetClientStatsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(applicationSlug: string): Promise<ClientStats> {
    return this.clientRepository.getStats(applicationSlug);
  }
}
