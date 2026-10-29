import { Prisma } from '@prisma/client';
import { HORTENSIAS_PROJECT_CODE } from '../data/sample-interiorismo-hortensias';
import { INTERIORISMO_APPLICATION_SLUG } from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-interiorismo-supplier-payments');

/** Abonos demo al proveedor (partidas con costo real en Hortensias). */
export async function seedHortensiasSupplierPayments(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
) {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) return;

  const project = await prisma.interiorProject.findFirst({
    where: {
      applicationId: interiorAppId,
      OR: [
        { code: HORTENSIAS_PROJECT_CODE },
        { legacyCode: HORTENSIAS_PROJECT_CODE },
      ],
    },
  });
  if (!project) return;

  const lineItems = await prisma.interiorBudgetRow.findMany({
    where: {
      budget: { projectId: project.id, isActive: true },
      kind: 'ITEM',
      actualCost: { not: null },
    },
    orderBy: { sortOrder: 'asc' },
    take: 3,
  });
  if (!lineItems.length) return;

  let created = 0;
  for (const item of lineItems) {
    const existing = await prisma.interiorBudgetRowSupplierPayment.count({
      where: { rowId: item.id },
    });
    if (existing > 0) continue;

    const actual = Number(item.actualCost ?? 0);
    const firstAmount = Math.round(actual * 0.5 * 100) / 100;
    await prisma.interiorBudgetRowSupplierPayment.create({
      data: {
        rowId: item.id,
        amount: new Prisma.Decimal(firstAmount),
        paidAt: new Date('2026-01-25'),
      },
    });
    created++;
  }

  if (created > 0) {
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Abonos proveedor demo Hortensias (${created} partidas)`,
    );
  }
}
