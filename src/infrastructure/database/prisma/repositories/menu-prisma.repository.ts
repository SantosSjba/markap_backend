import { Injectable } from '@nestjs/common';
import {
  MenuRepository,
  MenuData,
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
