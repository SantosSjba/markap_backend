import { Prisma } from '@prisma/client';
import type { SeedDb } from '../types';

export interface SeedBudgetItem {
  description: string;
  directCost: number;
  hasIgv?: boolean;
  actualCost?: number | null;
  supplierName?: string | null;
}

export interface SeedBudgetGroup {
  name: string;
  items: SeedBudgetItem[];
}

/**
 * Presupuesto v1 activo del proyecto con un grupo por ambiente y sus partidas.
 * No hace nada si el proyecto ya tiene presupuesto (seed idempotente).
 */
export async function seedInteriorBudget(
  prisma: SeedDb,
  projectId: string,
  groups: SeedBudgetGroup[],
): Promise<boolean> {
  if (await prisma.interiorBudget.count({ where: { projectId } })) return false;
  const project = await prisma.interiorProject.findUniqueOrThrow({
    where: { id: projectId },
    select: { currency: true, defaultUtilityPct: true, defaultIgvPct: true },
  });
  await prisma.interiorBudget.create({
    data: {
      projectId,
      version: 1,
      isActive: true,
      currency: project.currency,
      utilityPct: project.defaultUtilityPct,
      igvPct: project.defaultIgvPct,
      rows: {
        create: groups.map((g, gi) => ({
          kind: 'GROUP',
          description: g.name,
          sortOrder: gi,
        })),
      },
    },
  });
  const budget = await prisma.interiorBudget.findFirstOrThrow({
    where: { projectId },
    include: { rows: { orderBy: { sortOrder: 'asc' } } },
  });
  for (const [gi, g] of groups.entries()) {
    await prisma.interiorBudgetRow.createMany({
      data: g.items.map((item, ii) => ({
        budgetId: budget.id,
        parentId: budget.rows[gi].id,
        sortOrder: ii,
        kind: 'ITEM',
        description: item.description,
        directCost: new Prisma.Decimal(item.directCost),
        hasIgv: item.hasIgv ?? false,
        actualCost:
          item.actualCost != null ? new Prisma.Decimal(item.actualCost) : null,
        supplierName: item.supplierName ?? null,
        status: item.actualCost != null ? 'PURCHASED' : 'PENDING',
      })),
    });
  }
  return true;
}
