import { Injectable } from '@nestjs/common';
import {
  MenuRepository,
  MenuData,
  CreateMenuData,
  UpdateMenuData,
} from '../../../../application/repositories/menu.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MenuPrismaRepository implements MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByApplicationId(applicationId: string): Promise<MenuData[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        applicationId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return this.buildTree(menus.map(this.toData), null);
  }

  async findAllByApplicationId(applicationId: string): Promise<MenuData[]> {
    const menus = await this.prisma.menu.findMany({
      where: { applicationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return menus.map(this.toData);
  }

  async findById(id: string): Promise<MenuData | null> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });
    return menu ? this.toData(menu) : null;
  }

  async create(data: CreateMenuData): Promise<MenuData> {
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
    return this.toData(menu);
  }

  async update(id: string, data: UpdateMenuData): Promise<MenuData> {
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
    return this.toData(menu);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.menu.delete({
      where: { id },
    });
  }

  private buildTree(items: MenuData[], parentId: string | null): MenuData[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }))
      .sort((a, b) => a.order - b.order);
  }

  private toData(record: {
    id: string;
    applicationId: string;
    parentId: string | null;
    label: string;
    icon: string | null;
    path: string | null;
    order: number;
    isActive: boolean;
  }): MenuData {
    return {
      id: record.id,
      applicationId: record.applicationId,
      parentId: record.parentId,
      label: record.label,
      icon: record.icon,
      path: record.path,
      order: record.order,
      isActive: record.isActive,
    };
  }
}
