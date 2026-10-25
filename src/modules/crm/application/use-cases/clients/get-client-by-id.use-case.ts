import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { ClientDetail } from '../../../domain/entities/client.entity';
import type { ClientRepository } from '../../../domain/repositories/client.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';

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
  ): Promise<ClientDetail> {
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
