import { Injectable, Inject } from '@nestjs/common';
import { MenuRepository, MenuData } from '../../repositories/menu.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface GetMenusByApplicationInput {
  applicationSlug: string;
}

export interface MenuItemDto {
  id: string;
  label: string;
  icon: string | null;
  path: string | null;
  order: number;
  children?: MenuItemDto[];
}

@Injectable()
export class GetMenusByApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(input: GetMenusByApplicationInput): Promise<MenuItemDto[]> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    );

    if (!application) {
      throw new EntityNotFoundException('Application', input.applicationSlug);
    }

    const menus = await this.menuRepository.findByApplicationId(application.id);
    return this.mapToDto(menus);
  }

  private mapToDto(menus: MenuData[]): MenuItemDto[] {
    return menus.map((m) => ({
      id: m.id,
      label: m.label,
      icon: m.icon,
      path: m.path,
      order: m.order,
      children:
        m.children && m.children.length > 0
          ? this.mapToDto(m.children)
          : undefined,
    }));
  }
}
