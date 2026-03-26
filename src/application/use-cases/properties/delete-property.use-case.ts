import { Injectable, Inject } from '@nestjs/common';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeletePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new EntityNotFoundException('Property', id);
    await this.propertyRepository.softDelete(id);
    return { message: 'Propiedad eliminada correctamente' };
  }
}
