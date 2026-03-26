import { Injectable, Inject } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const client = await this.clientRepository.findById(id);
    if (!client) throw new EntityNotFoundException('Client', id);
    await this.clientRepository.softDelete(id);
    return { message: 'Cliente eliminado correctamente' };
  }
}
