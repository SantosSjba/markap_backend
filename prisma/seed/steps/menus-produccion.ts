import {
  PRODUCCION_APPLICATION_SLUG,
  PRODUCCION_CHILD_MENUS,
  PRODUCCION_PARENT_MENUS,
} from '../data';
import type { SeedDb } from '../types';

export async function seedProduccionMenus(prisma: SeedDb): Promise<void> {
  console.log('\n📂 Creating menus for Producción de Muebles...');
  const app = await prisma.application.findUnique({
    where: { slug: PRODUCCION_APPLICATION_SLUG },
  });

  if (!app) return;

  const menuIds: Record<string, string> = {};

  for (const m of PRODUCCION_PARENT_MENUS) {
    const existingMenu = await prisma.menu.findFirst({
      where: {
        applicationId: app.id,
        parentId: null,
        ...(m.path ? { path: m.path } : { label: m.label }),
      },
    });
    if (!existingMenu) {
      const menu = await prisma.menu.create({
        data: {
          applicationId: app.id,
          parentId: null,
          label: m.label,
          icon: m.icon,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      menuIds[m.label] = menu.id;
      console.log(`   ✅ Producción menu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existingMenu.id },
        data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
      });
      menuIds[m.label] = existingMenu.id;
      console.log(`   ✅ Producción menu "${m.label}" updated`);
    }
  }

  for (const m of PRODUCCION_CHILD_MENUS) {
    const parentId = menuIds[m.parentLabel];
    if (!parentId) continue;

    const existing = await prisma.menu.findFirst({
      where: {
        applicationId: app.id,
        label: m.label,
        parentId,
      },
    });
    if (!existing) {
      await prisma.menu.create({
        data: {
          applicationId: app.id,
          parentId,
          label: m.label,
          icon: null,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      console.log(`   ✅ Producción submenu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existing.id },
        data: { path: m.path, order: m.order },
      });
      console.log(`   ✅ Producción submenu "${m.label}" updated`);
    }
  }
}
