import { Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { Inject } from '@nestjs/common';
import { MenuRepository, CreateMenuData } from '../../repositories/menu.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface CreateMenuInput {
  applicationId?: string;
  applicationSlug?: string;
  parentId?: string | null;
  label: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
}

@Injectable()
export class CreateMenuUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(input: CreateMenuInput) {
    let applicationId = input.applicationId;

    if (!applicationId && input.applicationSlug) {
      const app = await this.applicationRepository.findBySlug(
        input.applicationSlug,
      );
      if (!app) {
        throw new EntityNotFoundException(
          'Application',
          input.applicationSlug,
        );
      }
      applicationId = app.id;
    }

    if (!applicationId) {
      throw new Error('applicationId or applicationSlug is required');
    }

    // Normalize parentId: empty string or undefined -> null
    let parentId: string | null = null;
    if (input.parentId && input.parentId.trim() !== '') {
      parentId = input.parentId.trim();
      const parentMenu = await this.menuRepository.findById(parentId);
      if (!parentMenu) {
        throw new EntityNotFoundException('Menu', parentId);
      }
      if (parentMenu.applicationId !== applicationId) {
        throw new Error(
          'El menú padre debe pertenecer a la misma aplicación',
        );
      }
    }

    const data: CreateMenuData = {
      applicationId,
      parentId,
      label: input.label,
      icon: input.icon ?? null,
      path: input.path ?? null,
      order: input.order ?? 0,
    };

    return this.menuRepository.create(data);
  }
}
