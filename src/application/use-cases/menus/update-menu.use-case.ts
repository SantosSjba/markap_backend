import { Injectable } from '@nestjs/common';
import { MenuRepository, UpdateMenuData } from '../../repositories/menu.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface UpdateMenuInput {
  id: string;
  parentId?: string | null;
  label?: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
  isActive?: boolean;
}

@Injectable()
export class UpdateMenuUseCase {
  constructor(private readonly menuRepository: MenuRepository) {}

  async execute(input: UpdateMenuInput) {
    const existing = await this.menuRepository.findById(input.id);
    if (!existing) {
      throw new EntityNotFoundException('Menu', input.id);
    }

    const data: UpdateMenuData = {};
    if (input.parentId !== undefined) {
      const parentId =
        !input.parentId || String(input.parentId).trim() === ''
          ? null
          : String(input.parentId).trim();
      if (parentId !== null) {
        const parentMenu = await this.menuRepository.findById(parentId);
        if (!parentMenu) {
          throw new EntityNotFoundException('Menu', parentId);
        }
        if (parentMenu.applicationId !== existing.applicationId) {
          throw new Error(
            'El menú padre debe pertenecer a la misma aplicación',
          );
        }
        if (parentId === input.id) {
          throw new Error('Un menú no puede ser padre de sí mismo');
        }
      }
      data.parentId = parentId;
    }
    if (input.label !== undefined) data.label = input.label;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.path !== undefined) data.path = input.path;
    if (input.order !== undefined) data.order = input.order;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return this.menuRepository.update(input.id, data);
  }
}
