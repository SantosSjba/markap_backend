import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { PropertyData } from '../../repositories/property.repository';

@Injectable()
export class GetPropertyByIdUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(id: string): Promise<PropertyData> {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException(`Propiedad con id ${id} no encontrada`);
    }
    return property;
  }
}
