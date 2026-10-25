import {
  PRODUCCION_APPLICATION_SLUG,
  PRODUCCION_CONFIG_DEFAULTS,
} from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-produccion-config');

/**
 * Parametrización base de Producción (settings, categorías, etapas, unidades, numeración).
 */
export async function seedProduccionConfig(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  produccion app not found — skipping config seed',
    );
    return;
  }

  const settingsCount = await prisma.produccionAppSettings.count({
    where: { applicationId: appId },
  });
  if (settingsCount === 0) {
    await prisma.produccionAppSettings.create({
      data: { applicationId: appId },
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Settings producción creados',
    );
  }

  const catCount = await prisma.produccionFurnitureCategoryConfig.count({
    where: { applicationId: appId },
  });
  if (catCount === 0) {
    await prisma.produccionFurnitureCategoryConfig.createMany({
      data: PRODUCCION_CONFIG_DEFAULTS.furnitureCategories.map((c) => ({
        applicationId: appId,
        code: c.code,
        label: c.label,
        sortOrder: c.sortOrder,
        isActive: true,
      })),
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Categorías de muebles sembradas',
    );
  }

  const matCatCount = await prisma.produccionMaterialCategoryConfig.count({
    where: { applicationId: appId },
  });
  if (matCatCount === 0) {
    await prisma.produccionMaterialCategoryConfig.createMany({
      data: PRODUCCION_CONFIG_DEFAULTS.materialCategories.map((c) => ({
        applicationId: appId,
        code: c.code,
        label: c.label,
        sortOrder: c.sortOrder,
        isActive: true,
      })),
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Categorías de materiales sembradas',
    );
  }

  const stageCount = await prisma.produccionProductionStageConfig.count({
    where: { applicationId: appId },
  });
  if (stageCount === 0) {
    await prisma.produccionProductionStageConfig.createMany({
      data: PRODUCCION_CONFIG_DEFAULTS.productionStages.map((s) => ({
        applicationId: appId,
        stageKey: s.stageKey,
        label: s.label,
        sortOrder: s.sortOrder,
        isActive: true,
      })),
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Etapas de producción sembradas',
    );
  }

  const unitCount = await prisma.produccionUnitConfig.count({
    where: { applicationId: appId },
  });
  if (unitCount === 0) {
    await prisma.produccionUnitConfig.createMany({
      data: PRODUCCION_CONFIG_DEFAULTS.units.map((u) => ({
        applicationId: appId,
        code: u.code,
        label: u.label,
        sortOrder: u.sortOrder,
        isActive: true,
      })),
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Unidades de medida sembradas',
    );
  }

  for (const def of PRODUCCION_CONFIG_DEFAULTS.numbering) {
    const exists = await prisma.produccionNumberingSeries.count({
      where: { applicationId: appId, seriesKey: def.seriesKey },
    });
    if (exists > 0) continue;
    await prisma.produccionNumberingSeries.create({
      data: {
        applicationId: appId,
        seriesKey: def.seriesKey,
        prefix: def.prefix,
        lastNumber: 0,
        includeYear: def.includeYear,
        padLength: 4,
      },
    });
  }
  logger.info(
    { event: 'seed.progress' },
    '\n⚙️  Configuración producción lista',
  );
}
