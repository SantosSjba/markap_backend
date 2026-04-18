import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import type { PropertyData } from '../../repositories/property.repository';

@Injectable()
export class GetPropertyByIdUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  /**
   * @param expectedApplicationSlug Si se envía (ej. ventas), la propiedad debe pertenecer a esa aplicación.
   */
  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<PropertyData> {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
    }
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(
        property.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
      }
    }
    return property;
  }
}
