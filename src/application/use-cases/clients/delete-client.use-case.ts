import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ClientRepository } from '@domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '@domain/repositories/client.repository';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '@domain/repositories/rental.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '@domain/repositories/application.repository';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import { PROPERTY_REPOSITORY } from '@domain/repositories/property.repository';
import { EntityNotFoundException } from '@domain/exceptions';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
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
    if (isVentasApp && client.clientType === 'OWNER') {
      const props = await this.propertyRepository.countActiveByOwnerId(id, client.applicationId);
      if (props > 0) {
        throw new BadRequestException(
          'No se puede eliminar el propietario mientras tenga propiedades en inventario.',
        );
      }
    }
    if (!isVentasApp) {
      const activeRentals = await this.rentalRepository.countActiveInvolvingClient(
        id,
        client.applicationId,
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
