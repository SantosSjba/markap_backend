import { Injectable, Inject } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { ClientDetailData } from '../../repositories/client.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class GetClientByIdUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  /**
   * @param expectedApplicationSlug Si se envía (ej. ventas), el cliente debe pertenecer a esa aplicación.
   */
  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<ClientDetailData> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new EntityNotFoundException('Client', id);
    }
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(
        client.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Client', id);
      }
    }
    return client;
  }
}
