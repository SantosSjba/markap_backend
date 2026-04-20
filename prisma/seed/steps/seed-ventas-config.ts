import type { SeedDb } from '../types';

/**
 * Parametrización Ventas (pipeline + numeración). Idempotente via ensure logic en repositorio.
 * Aquí solo invocamos la misma semántica que el runtime para entornos sin primer request HTTP.
 */
export async function seedVentasConfig(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const ventasAppId = appIdBySlug['ventas'];
  if (!ventasAppId) {
    console.log('\n⚠️  Ventas app not found — skipping seed-ventas-config');
    return;
  }

  const nPipeline = await prisma.ventasPipelineStageConfig.count({
    where: { applicationId: ventasAppId },
  });
  if (nPipeline === 0) {
    await prisma.ventasPipelineStageConfig.createMany({
      data: [
        { applicationId: ventasAppId, code: 'PROSPECT', label: 'Prospecto', sortOrder: 0, isActive: true },
        { applicationId: ventasAppId, code: 'VISIT', label: 'Visita', sortOrder: 1, isActive: true },
        { applicationId: ventasAppId, code: 'NEGOTIATION', label: 'Negociación', sortOrder: 2, isActive: true },
        { applicationId: ventasAppId, code: 'SEPARATION', label: 'Separación', sortOrder: 3, isActive: true },
        { applicationId: ventasAppId, code: 'CLOSING', label: 'Cierre', sortOrder: 4, isActive: true },
      ],
    });
    console.log('\n   ✓ ventas-config: etapas de pipeline por defecto');
  } else {
    console.log('\n   ✓ ventas-config: pipeline ya existe — skip');
  }

  const nSeries = await prisma.ventasNumberingSeries.count({
    where: { applicationId: ventasAppId, seriesKey: 'SALE_PROCESS' },
  });
  if (nSeries === 0) {
    const processCount = await prisma.saleProcess.count({ where: { applicationId: ventasAppId } });
    await prisma.ventasNumberingSeries.create({
      data: {
        applicationId: ventasAppId,
        seriesKey: 'SALE_PROCESS',
        prefix: 'VNT-PRC',
        lastNumber: processCount,
      },
    });
    console.log('   ✓ ventas-config: serie SALE_PROCESS (prefijo VNT-PRC, correlativo sincronizado)');
  } else {
    console.log('   ✓ ventas-config: numeración ya existe — skip');
  }
}
