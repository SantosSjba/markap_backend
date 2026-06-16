import { Prisma } from '@prisma/client';
import {
  HORTENSIAS_BUDGET_SECTIONS,
  HORTENSIAS_CLIENT_DEPOSIT,
  HORTENSIAS_PROJECT_CODE,
} from '../data/sample-interiorismo-hortensias';
import { INTERIORISMO_APPLICATION_SLUG, SAMPLE_INTERIOR_RESIDENTIAL_CLIENT } from '../data';
import type { SeedDb } from '../types';

/**
 * Proyecto demo Hortensias con presupuesto modelo Excel (secciones + partidas + abono cliente).
 */
export async function seedInteriorismoHortensiasProject(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) return;

  const client = await prisma.client.findFirst({
    where: {
      applicationId: interiorAppId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_INTERIOR_RESIDENTIAL_CLIENT.documentNumber,
      deletedAt: null,
    },
  });
  if (!client) {
    console.log('   ⚠️  Cliente residencial no encontrado — omitiendo Hortensias');
    return;
  }

  const exists = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: HORTENSIAS_PROJECT_CODE },
  });
  if (exists) {
    console.log('   ⏭️  Proyecto Hortensias ya existe');
    return;
  }

  const project = await prisma.interiorProject.create({
    data: {
      applicationId: interiorAppId,
      code: HORTENSIAS_PROJECT_CODE,
      name: 'Presupuesto Implementación Departamento Hortensias',
      clientId: client.id,
      projectType: 'IMPLEMENTATION',
      status: 'IN_PROGRESS',
      addressLine: 'Proyecto Hortensias',
      city: 'TRUJILLO',
      interventionLevel: 'I',
      executionTimeNote: '30 DÍAS HÁBILES',
      currency: 'PEN',
      defaultUtilityPct: new Prisma.Decimal(20),
      defaultIgvPct: new Prisma.Decimal(18),
      startDate: new Date('2026-01-15'),
      progressPct: new Prisma.Decimal(35),
      budgetSections: {
        create: HORTENSIAS_BUDGET_SECTIONS.map((section) => ({
          name: section.name,
          sortOrder: section.sortOrder,
          lineItems: {
            create: section.items.map((item) => ({
              sortOrder: item.sortOrder,
              description: item.description,
              budgetedCost: new Prisma.Decimal(item.budgetedCost),
              hasIgv: item.hasIgv ?? false,
              actualPurchaseCost:
                item.actualPurchaseCost != null
                  ? new Prisma.Decimal(item.actualPurchaseCost)
                  : null,
              supplierName: item.supplierName ?? null,
            })),
          },
        })),
      },
      payments: {
        create: {
          paidAt: new Date('2026-01-20'),
          amount: new Prisma.Decimal(HORTENSIAS_CLIENT_DEPOSIT.amount),
          concept: HORTENSIAS_CLIENT_DEPOSIT.concept,
          paymentType: HORTENSIAS_CLIENT_DEPOSIT.paymentType,
          status: 'PAID',
        },
      },
    },
  });

  console.log(`   ✅ Proyecto Hortensias (${project.code}) con presupuesto Excel`);
}
