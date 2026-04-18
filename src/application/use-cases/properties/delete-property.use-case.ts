import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeletePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
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

    const app = await this.applicationRepository.findById(property.applicationId);
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
      }
    }

    const isVentasInventory = app?.slug === 'ventas';
    if (!isVentasInventory) {
      const activeRentals = await this.rentalRepository.countActiveByPropertyId(
        id,
      );
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
