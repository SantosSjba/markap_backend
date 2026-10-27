import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { RentalRepository } from '../../../../rentals/domain/repositories/rental.repository';
import type { PropertyRepository } from '../../../domain/repositories/property.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { RENTAL_REPOSITORY } from '../../../../rentals/domain/repositories/rental.repository';
import { PROPERTY_REPOSITORY } from '../../../domain/repositories/property.repository';
import type { VentasSalesRepository } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { VENTAS_SALES_REPOSITORY } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { assertPropertyDeletableForVentas } from '../../../../ventas/application/validators/sales-usage.validator';

@Injectable()
export class DeletePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
  ) {}

  /**
   * @param expectedApplicationSlug Si se envía, la propiedad debe pertenecer a esa app (evita borrar otra aplicación por ID).
   */
  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<{ message: string }> {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new EntityNotFoundException('Property', id);

    const app = await this.applicationRepository.findById(
      property.applicationId,
    );
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
      }
    }

    const isVentasInventory = app?.slug === 'ventas';
    if (isVentasInventory) {
      assertPropertyDeletableForVentas(
        await this.ventasSales.getSalesUsage(property.applicationId, {
          propertyId: id,
        }),
      );
    } else {
      const activeRentals =
        await this.rentalRepository.countActiveByPropertyId(id);
      if (activeRentals > 0) {
        throw new BadRequestException(
          'No se puede eliminar la propiedad mientras tenga un contrato de alquiler vigente.',
        );
      }
    }

    await this.propertyRepository.softDelete(id);
    return { message: 'Propiedad eliminada correctamente' };
  }
}
