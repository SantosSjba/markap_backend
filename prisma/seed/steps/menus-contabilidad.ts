import {
  CONTABILIDAD_APPLICATION_SLUG,
  CONTABILIDAD_CHILD_MENUS,
  CONTABILIDAD_DEPRECATED_PARENT_LABELS,
  CONTABILIDAD_DEPRECATED_PATHS,
  CONTABILIDAD_PARENT_MENUS,
} from '../data';
import type { SeedDb } from '../types';

export async function seedContabilidadMenus(prisma: SeedDb): Promise<void> {
  console.log('\n📂 Creating menus for Sistema Contable...');
  const app = await prisma.application.findUnique({
    where: { slug: CONTABILIDAD_APPLICATION_SLUG },
  });

  if (!app) return;

  const menuIds: Record<string, string> = {};

  for (const m of CONTABILIDAD_PARENT_MENUS) {
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
      console.log(`   ✅ Contabilidad menu "${m.label}" created`);
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
      console.log(`   ✅ Contabilidad menu "${m.label}" updated`);
    }
  }

  for (const m of CONTABILIDAD_CHILD_MENUS) {
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
      console.log(`   ✅ Contabilidad submenu "${m.label}" created`);
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
      console.log(`   ✅ Contabilidad submenu "${m.label}" updated`);
    }
  }

  const deactivatedPaths = await prisma.menu.updateMany({
    where: {
      applicationId: app.id,
      path: { in: CONTABILIDAD_DEPRECATED_PATHS },
    },
    data: { isActive: false },
  });
  if (deactivatedPaths.count > 0) {
    console.log(`   ✅ ${deactivatedPaths.count} ruta(s) obsoleta(s) desactivada(s)`);
  }

  for (const label of CONTABILIDAD_DEPRECATED_PARENT_LABELS) {
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
