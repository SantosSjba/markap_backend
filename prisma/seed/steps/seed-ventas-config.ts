import type { SeedDb } from '../types';

const PIPELINE_STAGES = [
  { code: 'SEPARATION', label: 'Separación', sortOrder: 0, isActive: true },
  { code: 'ARRAS', label: 'Contrato de arras', sortOrder: 1, isActive: true },
  { code: 'MINUTA', label: 'Minuta', sortOrder: 2, isActive: true },
  { code: 'PUBLIC_DEED', label: 'Escritura pública', sortOrder: 3, isActive: true },
] as const;

/**
 * Parametrización Ventas (pipeline + numeración).
 * Pipeline: siempre sincroniza las 4 etapas oficiales del proceso de venta.
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

  await prisma.ventasPipelineStageConfig.deleteMany({
    where: { applicationId: ventasAppId },
  });
  await prisma.ventasPipelineStageConfig.createMany({
    data: PIPELINE_STAGES.map((s) => ({
      applicationId: ventasAppId,
      code: s.code,
      label: s.label,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    })),
  });
  console.log('\n   ✓ ventas-config: etapas de pipeline (Separación → Escritura pública)');

  // Migrar procesos con etapas antiguas del embudo CRM previo
  await prisma.$executeRaw`
    UPDATE sale_processes sp
    SET pipeline_stage = CASE sp.pipeline_stage
      WHEN 'SEPARATION' THEN 'SEPARATION'
      WHEN 'CLOSING' THEN 'PUBLIC_DEED'
      WHEN 'PUBLIC_DEED' THEN 'PUBLIC_DEED'
      WHEN 'ARRAS' THEN 'ARRAS'
      WHEN 'MINUTA' THEN 'MINUTA'
      ELSE 'SEPARATION'
    END
    WHERE sp.application_id = ${ventasAppId}::text
      AND sp.pipeline_stage NOT IN ('SEPARATION', 'ARRAS', 'MINUTA', 'PUBLIC_DEED')
  `;

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
