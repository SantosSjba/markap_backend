import {
  INTERIORISMO_APPLICATION_SLUG,
  INTERIORISMO_CHILD_MENUS,
  INTERIORISMO_OBSOLETE_MENU_PATH_PREFIXES,
  INTERIORISMO_OBSOLETE_PARENT_LABELS,
  INTERIORISMO_PARENT_MENUS,
} from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:menus-interiorismo');

export async function seedInteriorismoMenus(prisma: SeedDb): Promise<void> {
  logger.info(
    { event: 'seed.progress' },
    '\n📂 Creating menus for Interiorismo...',
  );
  const app = await prisma.application.findUnique({
    where: { slug: INTERIORISMO_APPLICATION_SLUG },
  });

  if (!app) return;

  const menuIds: Record<string, string> = {};

  for (const m of INTERIORISMO_PARENT_MENUS) {
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
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Interiorismo menu "${m.label}" created`,
      );
    } else {
      await prisma.menu.update({
        where: { id: existingMenu.id },
        data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
      });
      menuIds[m.label] = existingMenu.id;
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Interiorismo menu "${m.label}" updated`,
      );
    }
  }

  for (const m of INTERIORISMO_CHILD_MENUS) {
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
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Interiorismo submenu "${m.label}" created`,
      );
    } else {
      await prisma.menu.update({
        where: { id: existing.id },
        data: { path: m.path, order: m.order },
      });
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Interiorismo submenu "${m.label}" updated`,
      );
    }
  }

  const pathDeactivated = await prisma.menu.updateMany({
    where: {
      applicationId: app.id,
      isActive: true,
      OR: INTERIORISMO_OBSOLETE_MENU_PATH_PREFIXES.flatMap((prefix) => [
        { path: prefix },
        { path: { startsWith: `${prefix}/` } },
      ]),
    },
    data: { isActive: false },
  });
  if (pathDeactivated.count > 0) {
    logger.info(
      { event: 'seed.progress' },
      `   ✅ ${pathDeactivated.count} menú(es) obsoleto(s) por ruta desactivado(s)`,
    );
  }

  for (const label of INTERIORISMO_OBSOLETE_PARENT_LABELS) {
    const parent = await prisma.menu.findFirst({
      where: { applicationId: app.id, label, parentId: null },
    });
    if (!parent) continue;

    const childDeactivated = await prisma.menu.updateMany({
      where: { applicationId: app.id, parentId: parent.id, isActive: true },
      data: { isActive: false },
    });

    if (parent.isActive || childDeactivated.count > 0) {
      await prisma.menu.update({
        where: { id: parent.id },
        data: { isActive: false },
      });
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Menú obsoleto "${label}" desactivado${childDeactivated.count ? ` (+${childDeactivated.count} hijo(s))` : ''}`,
      );
    }
  }
}
