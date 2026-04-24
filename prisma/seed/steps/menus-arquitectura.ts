import {
  ARQUITECTURA_APPLICATION_SLUG,
  ARQUITECTURA_CHILD_MENUS,
  ARQUITECTURA_PARENT_MENUS,
} from '../data';
import type { SeedDb } from '../types';

export async function seedArquitecturaMenus(prisma: SeedDb): Promise<void> {
  console.log('\n📂 Creating menus for Arquitectura...');
  const app = await prisma.application.findUnique({
    where: { slug: ARQUITECTURA_APPLICATION_SLUG },
  });

  if (!app) return;

  const menuIds: Record<string, string> = {};

  for (const m of ARQUITECTURA_PARENT_MENUS) {
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
      console.log(`   ✅ Arquitectura menu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existingMenu.id },
        data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
      });
      menuIds[m.label] = existingMenu.id;
      console.log(`   ✅ Arquitectura menu "${m.label}" updated`);
    }
  }

  for (const m of ARQUITECTURA_CHILD_MENUS) {
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
      console.log(`   ✅ Arquitectura submenu "${m.label}" created`);
    } else {
      await prisma.menu.update({
        where: { id: existing.id },
        data: { path: m.path, order: m.order },
      });
      console.log(`   ✅ Arquitectura submenu "${m.label}" updated`);
    }
  }
}
