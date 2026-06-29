import {
  PRODUCCION_APPLICATION_SLUG,
  PRODUCCION_CHILD_MENUS,
  PRODUCCION_DEPRECATED_PARENT_LABELS,
  PRODUCCION_DEPRECATED_PATHS,
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
        data: {
          label: m.label,
          icon: m.icon,
          path: m.path,
          order: m.order,
          isActive: true,
        },
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
        path: m.path,
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
        data: {
          parentId,
          label: m.label,
          path: m.path,
          order: m.order,
          isActive: true,
        },
      });
      console.log(`   ✅ Producción submenu "${m.label}" updated`);
    }
  }

  const deactivatedPaths = await prisma.menu.updateMany({
    where: {
      applicationId: app.id,
      path: { in: PRODUCCION_DEPRECATED_PATHS },
    },
    data: { isActive: false },
  });
  if (deactivatedPaths.count > 0) {
    console.log(`   ✅ ${deactivatedPaths.count} ruta(s) obsoleta(s) desactivada(s)`);
  }

  for (const label of PRODUCCION_DEPRECATED_PARENT_LABELS) {
    const obsolete = await prisma.menu.findFirst({
      where: { applicationId: app.id, label, parentId: null },
    });
    if (obsolete) {
      await prisma.menu.update({
        where: { id: obsolete.id },
        data: { isActive: false },
      });
      await prisma.menu.updateMany({
        where: { parentId: obsolete.id },
        data: { isActive: false },
      });
      console.log(`   ✅ Menú padre obsoleto "${label}" desactivado`);
    }
  }
}
