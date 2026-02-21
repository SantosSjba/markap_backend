import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { PropertyData, UpdatePropertyData } from '../../repositories/property.repository';

@Injectable()
export class UpdatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(data: UpdatePropertyData): Promise<PropertyData> {
    const existing = await this.propertyRepository.findById(data.id);
    if (!existing) {
      throw new NotFoundException(`Propiedad con id ${data.id} no encontrada`);
    }
    return this.propertyRepository.update(data);
  }
}
