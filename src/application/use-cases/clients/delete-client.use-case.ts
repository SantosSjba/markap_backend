import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  /**
   * @param expectedApplicationSlug Si se envía, el cliente debe pertenecer a esa aplicación.
   */
  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<{ message: string }> {
    const client = await this.clientRepository.findById(id);
    if (!client) throw new EntityNotFoundException('Client', id);

    const app = await this.applicationRepository.findById(client.applicationId);
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Client', id);
      }
    }

    const isVentasApp = app?.slug === 'ventas';
    if (!isVentasApp) {
      const activeRentals = await this.rentalRepository.countActiveInvolvingClient(
        id,
      );
      if (activeRentals > 0) {
        throw new BadRequestException(
          'No se puede eliminar el cliente mientras sea inquilino o propietario en un contrato de alquiler vigente.',
        );
      }
    }

    await this.clientRepository.softDelete(id);
    return { message: 'Cliente eliminado correctamente' };
  }
}
