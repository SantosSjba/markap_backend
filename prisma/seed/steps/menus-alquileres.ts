import {
  ALQUILERES_CHILD_MENUS,
  ALQUILERES_PARENT_MENUS,
  SEED_PRIMARY_APPLICATION_SLUG,
} from '../data';
import type { SeedDb } from '../types';

export async function seedAlquileresMenus(prisma: SeedDb): Promise<void> {
  console.log('\n📂 Creating menus for Alquileres...');
  const alquileresApp = await prisma.application.findUnique({
    where: { slug: SEED_PRIMARY_APPLICATION_SLUG },
  });

  if (!alquileresApp) return;

  const createdMenuIds: Record<string, string> = {};

  for (const m of ALQUILERES_PARENT_MENUS) {
    const existingMenu = await prisma.menu.findFirst({
      where: {
        applicationId: alquileresApp.id,
        parentId: null,
        ...(m.path ? { path: m.path } : { label: m.label }),
      },
    });
    if (!existingMenu) {
      const menu = await prisma.menu.create({
        data: {
          applicationId: alquileresApp.id,
          parentId: null,
          label: m.label,
          icon: m.icon,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      createdMenuIds[m.label] = menu.id;
      console.log(`   ✅ Menu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existingMenu.id },
        data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
      });
      createdMenuIds[m.label] = existingMenu.id;
      console.log(`   ✅ Menu "${m.label}" updated`);
    }
  }

  for (const m of ALQUILERES_CHILD_MENUS) {
    const parentId = createdMenuIds[m.parentLabel];
    if (!parentId) continue;

    const existing = await prisma.menu.findFirst({
      where: {
        applicationId: alquileresApp.id,
        label: m.label,
        parentId,
      },
    });
    if (!existing) {
      await prisma.menu.create({
        data: {
          applicationId: alquileresApp.id,
          parentId,
          label: m.label,
          icon: null,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      console.log(`   ✅ Submenu "${m.label}" created`);
    }
  }
}
