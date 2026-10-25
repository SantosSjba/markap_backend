import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';

import { MenuRepository } from '../../../domain/repositories/menu.repository';

@Injectable()
export class DeleteMenuUseCase {
  constructor(private readonly menuRepository: MenuRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.menuRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Menu', id);
    }
    await this.menuRepository.delete(id);
  }
}
