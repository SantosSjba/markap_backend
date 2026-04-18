import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import type { PropertyData, UpdatePropertyData } from '../../repositories/property.repository';

const VENTAS_LISTING = new Set(['AVAILABLE', 'RESERVED', 'SOLD']);
const ALQUILERES_LISTING = new Set([
  'AVAILABLE',
  'RENTED',
  'EXPIRING',
  'MAINTENANCE',
]);

@Injectable()
export class UpdatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(
    data: UpdatePropertyData,
    expectedApplicationSlug?: string,
  ): Promise<PropertyData> {
    const existing = await this.propertyRepository.findById(data.id);
    if (!existing) {
      throw new NotFoundException(`Propiedad con id ${data.id} no encontrada`);
    }
    if (expectedApplicationSlug?.trim()) {
      const app = await this.applicationRepository.findById(
        existing.applicationId,
      );
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new NotFoundException(`Propiedad con id ${data.id} no encontrada`);
      }
    }
    if (data.listingStatus !== undefined && data.listingStatus !== null) {
      const app = await this.applicationRepository.findById(
        existing.applicationId,
      );
      const slug = app?.slug ?? '';
      const ls = data.listingStatus;
      if (slug === 'ventas') {
        if (!VENTAS_LISTING.has(ls)) {
          throw new BadRequestException(
            'En Ventas el estado comercial debe ser AVAILABLE, RESERVED o SOLD.',
          );
        }
      } else if (!ALQUILERES_LISTING.has(ls)) {
        throw new BadRequestException(
          'Estado de listado no válido para esta aplicación.',
        );
      }
    }
    return this.propertyRepository.update(data);
  }
}
