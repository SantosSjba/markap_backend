import { Prisma } from '@prisma/client';

/**
 * Base = cantidad × precio unitario; utilidad e IGV en porcentaje sobre base estable.
 */
export function computeInteriorBudgetLine(
  quantity: number,
  unitPrice: number,
  utilityPct: number,
  igvPct: number,
): {
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  baseAmount: Prisma.Decimal;
  utilityAmount: Prisma.Decimal;
  amountBeforeIgv: Prisma.Decimal;
  igvAmount: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
} {
  const q = new Prisma.Decimal(quantity);
  const p = new Prisma.Decimal(unitPrice);
  const baseAmount = q.mul(p);
  const utilityAmount = baseAmount.mul(new Prisma.Decimal(utilityPct)).div(new Prisma.Decimal(100));
  const amountBeforeIgv = baseAmount.add(utilityAmount);
  const igvAmount = amountBeforeIgv.mul(new Prisma.Decimal(igvPct)).div(new Prisma.Decimal(100));
  const lineTotal = amountBeforeIgv.add(igvAmount);
  return {
    quantity: q,
    unitPrice: p,
    baseAmount,
    utilityAmount,
    amountBeforeIgv,
    igvAmount,
    lineTotal,
  };
}
