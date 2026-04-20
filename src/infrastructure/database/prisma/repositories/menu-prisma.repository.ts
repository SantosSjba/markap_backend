import { Injectable } from '@nestjs/common';
import {
  MenuRepository,
  Menu,
  CreateMenuData,
  UpdateMenuData,
} from '@domain/repositories/menu.repository';
import { PrismaService } from '../prisma.service';
import { MenuPrismaMapper } from '../mappers/menu-prisma.mapper';

@Injectable()
export class MenuPrismaRepository implements MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByApplicationId(applicationId: string): Promise<Menu[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        applicationId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return this.buildTree(menus.map(MenuPrismaMapper.toDomain), null);
  }

  async findAllByApplicationId(applicationId: string): Promise<Menu[]> {
    const menus = await this.prisma.menu.findMany({
      where: { applicationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return menus.map(MenuPrismaMapper.toDomain);
  }

  async findById(id: string): Promise<Menu | null> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });
    return menu ? MenuPrismaMapper.toDomain(menu) : null;
  }

  async create(data: CreateMenuData): Promise<Menu> {
    const menu = await this.prisma.menu.create({
      data: {
        applicationId: data.applicationId,
        parentId: data.parentId ?? null,
        label: data.label,
        icon: data.icon ?? null,
        path: data.path ?? null,
        order: data.order ?? 0,
        isActive: true,
      },
    });
    return MenuPrismaMapper.toDomain(menu);
  }

  async update(id: string, data: UpdateMenuData): Promise<Menu> {
    const updateData: Record<string, unknown> = {};
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const menu = await this.prisma.menu.update({
      where: { id },
      data: updateData,
    });
    return MenuPrismaMapper.toDomain(menu);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.menu.delete({
      where: { id },
    });
  }

  private buildTree(items: Menu[], parentId: string | null): Menu[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = this.buildTree(items, item.id);
        return item.withChildren(children);
      })
      .sort((a, b) => a.order - b.order);
  }
}
