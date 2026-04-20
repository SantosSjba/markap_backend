import type { Menu } from '../entities/menu.entity';

export type { Menu } from '../entities/menu.entity';

export interface CreateMenuData {
  applicationId: string;
  parentId?: string | null;
  label: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
}

export interface UpdateMenuData {
  parentId?: string | null;
  label?: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
  isActive?: boolean;
}

export abstract class MenuRepository {
  abstract findByApplicationId(applicationId: string): Promise<Menu[]>;
  abstract findAllByApplicationId(applicationId: string): Promise<Menu[]>;
  abstract findById(id: string): Promise<Menu | null>;
  abstract create(data: CreateMenuData): Promise<Menu>;
  abstract update(id: string, data: UpdateMenuData): Promise<Menu>;
  abstract delete(id: string): Promise<void>;
}
