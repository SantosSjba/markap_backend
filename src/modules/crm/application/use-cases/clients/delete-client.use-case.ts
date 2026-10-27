import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { PropertyRepository } from '../../../../properties/domain/repositories/property.repository';
import type { RentalRepository } from '../../../../rentals/domain/repositories/rental.repository';
import type { ClientRepository } from '../../../domain/repositories/client.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { PROPERTY_REPOSITORY } from '../../../../properties/domain/repositories/property.repository';
import { RENTAL_REPOSITORY } from '../../../../rentals/domain/repositories/rental.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import type { VentasSalesRepository } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { VENTAS_SALES_REPOSITORY } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { assertClientDeletableForVentas } from '../../../../ventas/application/validators/sales-usage.validator';

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
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
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
    if (isVentasApp) {
      assertClientDeletableForVentas(
        await this.ventasSales.getSalesUsage(client.applicationId, {
          clientId: id,
        }),
      );
    }
    if (isVentasApp && client.clientType === 'OWNER') {
      const props = await this.propertyRepository.countActiveByOwnerId(
        id,
        client.applicationId,
      );
      if (props > 0) {
        throw new BadRequestException(
          'No se puede eliminar el propietario mientras tenga propiedades en inventario.',
        );
      }
    }
    if (!isVentasApp) {
      const activeRentals =
        await this.rentalRepository.countActiveInvolvingClient(
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
