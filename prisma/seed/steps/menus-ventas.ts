import {
  VENTAS_APPLICATION_SLUG,
  VENTAS_CHILD_MENUS,
  VENTAS_PARENT_MENUS,
} from '../data';
import type { SeedDb } from '../types';

export async function seedVentasMenus(prisma: SeedDb): Promise<void> {
  console.log('\n📂 Creating menus for Ventas...');
  const ventasApp = await prisma.application.findUnique({
    where: { slug: VENTAS_APPLICATION_SLUG },
  });

  if (!ventasApp) return;

  const ventasMenuIds: Record<string, string> = {};

  for (const m of VENTAS_PARENT_MENUS) {
    const existingMenu = await prisma.menu.findFirst({
      where: {
        applicationId: ventasApp.id,
        parentId: null,
        ...(m.path ? { path: m.path } : { label: m.label }),
      },
    });
    if (!existingMenu) {
      const menu = await prisma.menu.create({
        data: {
          applicationId: ventasApp.id,
          parentId: null,
          label: m.label,
          icon: m.icon,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      ventasMenuIds[m.label] = menu.id;
      console.log(`   ✅ Ventas menu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existingMenu.id },
        data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
      });
      ventasMenuIds[m.label] = existingMenu.id;
      console.log(`   ✅ Ventas menu "${m.label}" updated`);
    }
  }

  for (const m of VENTAS_CHILD_MENUS) {
    const parentId = ventasMenuIds[m.parentLabel];
    if (!parentId) continue;

    const existing = await prisma.menu.findFirst({
      where: {
        applicationId: ventasApp.id,
        label: m.label,
        parentId,
      },
    });
    if (!existing) {
      await prisma.menu.create({
        data: {
          applicationId: ventasApp.id,
          parentId,
          label: m.label,
          icon: null,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      console.log(`   ✅ Ventas submenu "${m.label}" created`);
    }
  }
}
