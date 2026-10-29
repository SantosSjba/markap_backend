import type { PrismaClient } from '@prisma/client';
import {
  computeBudgetSheet,
  round2,
  type BudgetIgvMode,
  type BudgetMarginMode,
  type BudgetRowKind,
} from '../../../domain/budget/budget-sheet.calculator';

type BudgetPrisma = Pick<PrismaClient, 'interiorBudget'>;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Total del presupuesto activo de un proyecto (mismo cálculo que la hoja) y cuántas filas tiene.
 * Sin presupuesto o sin filas → `{ total: 0, rowCount: 0 }`.
 */
export async function getInteriorBudgetTotal(
  prisma: BudgetPrisma,
  projectId: string,
): Promise<{ total: number; rowCount: number }> {
  const budget = await prisma.interiorBudget.findFirst({
    where: { projectId, isActive: true },
    include: {
      rows: {
        select: {
          id: true,
          parentId: true,
          sortOrder: true,
          kind: true,
          quantity: true,
          unitPrice: true,
          directCost: true,
          actualCost: true,
          utilityPctOverride: true,
          hasIgv: true,
        },
      },
    },
  });
  if (!budget?.rows.length) return { total: 0, rowCount: 0 };
  const sheet = computeBudgetSheet(
    {
      currency: budget.currency,
      exchangeRate: num(budget.exchangeRate),
      marginMode: budget.marginMode as BudgetMarginMode,
      utilityPct: num(budget.utilityPct) ?? 0,
      overheadPct: num(budget.overheadPct) ?? 0,
      igvMode: budget.igvMode as BudgetIgvMode,
      igvPct: num(budget.igvPct) ?? 0,
    },
    budget.rows.map((r) => ({
      ...r,
      kind: r.kind as BudgetRowKind,
      code: null,
      description: '',
      unit: null,
      quantity: num(r.quantity),
      unitPrice: num(r.unitPrice),
      directCost: num(r.directCost),
      actualCost: num(r.actualCost),
      utilityPctOverride: num(r.utilityPctOverride),
      supplierPaymentsTotal: 0,
    })),
  );
  return { total: sheet.totals.total, rowCount: budget.rows.length };
}

export async function sumInteriorBudgetTotals(
  prisma: BudgetPrisma,
  projectIds: string[],
): Promise<number> {
  let sum = 0;
  for (const id of projectIds)
    sum += (await getInteriorBudgetTotal(prisma, id)).total;
  return round2(sum);
}
