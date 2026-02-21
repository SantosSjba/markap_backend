import { Injectable, Inject } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { ClientData, UpdateClientData } from '../../repositories/client.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(id: string, data: UpdateClientData): Promise<ClientData> {
    const existing = await this.clientRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Client', id);
    }
    return this.clientRepository.update(id, data);
  }
}
