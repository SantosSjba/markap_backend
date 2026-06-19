import { Prisma } from '@prisma/client';
import { HORTENSIAS_PROJECT_CODE } from '../data/sample-interiorismo-hortensias';
import { INTERIORISMO_APPLICATION_SLUG } from '../data';
import type { SeedDb } from '../types';

/** Abonos demo al proveedor (partidas con costo real en Hortensias). */
export async function seedHortensiasSupplierPayments(prisma: SeedDb, appIdBySlug: Record<string, string>) {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) return;

  const project = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: HORTENSIAS_PROJECT_CODE },
  });
  if (!project) return;

  const lineItems = await prisma.interiorProjectLineItem.findMany({
    where: {
      section: { projectId: project.id },
      actualPurchaseCost: { not: null },
    },
    orderBy: { sortOrder: 'asc' },
    take: 3,
  });
  if (!lineItems.length) return;

  let created = 0;
  for (const item of lineItems) {
    const existing = await prisma.interiorLineItemSupplierPayment.count({
      where: { lineItemId: item.id },
    });
    if (existing > 0) continue;

    const actual = Number(item.actualPurchaseCost ?? 0);
    const firstAmount = Math.round(actual * 0.5 * 100) / 100;
    await prisma.interiorLineItemSupplierPayment.create({
      data: {
        lineItemId: item.id,
        paymentNumber: 1,
        amount: new Prisma.Decimal(firstAmount),
        paidAt: new Date('2026-01-25'),
      },
    });
    created++;
  }

  if (created > 0) {
    console.log(`   ✅ Abonos proveedor demo Hortensias (${created} partidas)`);
  }
}
