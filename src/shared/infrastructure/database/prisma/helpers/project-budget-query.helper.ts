import type { PrismaClient } from '@prisma/client';
import { computeLineItemPricing } from '../../../../domain/budgets/project-budget-calculations';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type ArquitecturaBudgetPrisma = Pick<
  PrismaClient,
  | 'arquitecturaProject'
  | 'arquitecturaProjectLineItem'
  | 'arquitecturaProjectSection'
>;

export async function getArquitecturaProjectBudgetPriceTotal(
  prisma: ArquitecturaBudgetPrisma,
  projectId: string,
): Promise<number> {
  const project = await prisma.arquitecturaProject.findUnique({
    where: { id: projectId },
    select: { defaultUtilityPct: true, defaultIgvPct: true },
  });
  if (!project) return 0;

  const utilityPct = num(project.defaultUtilityPct);
  const igvPct = num(project.defaultIgvPct);
  const items = await prisma.arquitecturaProjectLineItem.findMany({
    where: { section: { projectId } },
    select: { budgetedCost: true, hasIgv: true },
  });

  const total = items.reduce((sum, item) => {
    const pricing = computeLineItemPricing({
      budgetedCost: num(item.budgetedCost),
      hasIgv: item.hasIgv,
      utilityPct,
      igvPct,
    });
    return sum + pricing.price;
  }, 0);

  return Math.round(total * 100) / 100;
}

export async function sumArquitecturaProjectBudgetPriceTotals(
  prisma: ArquitecturaBudgetPrisma,
  projectIds: string[],
): Promise<number> {
  if (!projectIds.length) return 0;
  let sum = 0;
  for (const id of projectIds) {
    sum += await getArquitecturaProjectBudgetPriceTotal(prisma, id);
  }
  return Math.round(sum * 100) / 100;
}
