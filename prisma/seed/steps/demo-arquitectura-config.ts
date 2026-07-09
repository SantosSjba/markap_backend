import { ARQUITECTURA_APPLICATION_SLUG, ARQUITECTURA_CONFIG_DEFAULTS } from '../data';
import type { SeedDb } from '../types';

/**
 * Etapas de ciclo y numeración por defecto para Arquitectura.
 */
export async function seedArquitecturaConfig(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  arquitectura app not found — skipping config seed');
    return;
  }

  const stageCount = await prisma.arquitecturaProjectStageConfig.count({ where: { applicationId: appId } });
  if (stageCount === 0) {
    await prisma.arquitecturaProjectStageConfig.createMany({
      data: ARQUITECTURA_CONFIG_DEFAULTS.projectStages.map((s) => ({
        applicationId: appId,
        code: s.code,
        label: s.label,
        sortOrder: s.sortOrder,
        isActive: true,
      })),
    });
    console.log('   ✅ Etapas de proyecto arquitectura sembradas');
  }

  for (const def of ARQUITECTURA_CONFIG_DEFAULTS.numbering) {
    const exists = await prisma.arquitecturaNumberingSeries.count({
      where: { applicationId: appId, seriesKey: def.seriesKey },
    });
    if (exists > 0) continue;
    await prisma.arquitecturaNumberingSeries.create({
      data: {
        applicationId: appId,
        seriesKey: def.seriesKey,
        prefix: def.prefix,
        lastNumber: 0,
      },
    });
  }
  console.log('   ✅ Numeración arquitectura lista');
}
