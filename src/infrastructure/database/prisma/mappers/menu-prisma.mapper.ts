import { Menu } from '@domain/entities/menu.entity';

type MenuRow = {
  id: string;
  applicationId: string;
  parentId: string | null;
  label: string;
  icon: string | null;
  path: string | null;
  order: number;
  isActive: boolean;
};

export class MenuPrismaMapper {
  static toDomain(record: MenuRow): Menu {
    return Menu.leaf(
      record.id,
      record.applicationId,
      record.parentId,
      record.label,
      record.icon,
      record.path,
      record.order,
      record.isActive,
    );
  }
}
