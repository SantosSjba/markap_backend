import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export const SALE_COMMISSION_DEDUCTIBLE_TYPES = [
  'TRAVEL',
  'TAX',
  'NOTARY',
  'REGISTRY',
  'OTHER',
] as const;

export type SaleCommissionDeductibleType =
  (typeof SALE_COMMISSION_DEDUCTIBLE_TYPES)[number];

export type SaleCommissionPaymentPartInput = {
  label?: string | null;
  amount?: number | null;
  percentOfNet?: number | null;
  dueDate?: string | null;
};

export type SaleCommissionDeductibleInput = {
  deductibleType: string;
  description?: string | null;
  amount: number;
};

export type ResolvedPaymentPart = {
  partNumber: number;
  label: string | null;
  amount: number;
  dueDate: Date | null;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseDueDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Fecha de vencimiento de cuota inválida.');
  }
  return d;
}

export function sumDeductibles(
  deductibles: { amount: number }[],
): number {
  return roundMoney(deductibles.reduce((s, d) => s + d.amount, 0));
}

export function computeNetPayable(
  gross: number,
  deductibles: { amount: number }[],
): number {
  return Math.max(0, roundMoney(gross - sumDeductibles(deductibles)));
}

export function resolvePaymentPartAmounts(
  net: number,
  parts: SaleCommissionPaymentPartInput[],
): ResolvedPaymentPart[] {
  if (!parts.length) {
    return [{ partNumber: 1, label: null, amount: roundMoney(net), dueDate: null }];
  }

  const amounts: number[] = new Array(parts.length).fill(NaN);
  let explicitSum = 0;
  const percentOnly: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.amount != null && p.amount >= 0) {
      amounts[i] = roundMoney(p.amount);
      explicitSum += amounts[i];
    } else if (p.percentOfNet != null && p.percentOfNet >= 0) {
      percentOnly.push(i);
    }
  }

  if (percentOnly.length === parts.length) {
    const pctSum = percentOnly.reduce((s, i) => s + parts[i].percentOfNet!, 0);
    if (Math.abs(pctSum - 100) > 0.05) {
      throw new BadRequestException(
        'Los porcentajes de las partes de pago deben sumar 100%.',
      );
    }
    for (const i of percentOnly) {
      amounts[i] = roundMoney(net * (parts[i].percentOfNet! / 100));
    }
  } else if (percentOnly.length > 0) {
    const remaining = Math.max(0, net - explicitSum);
    const pctSum = percentOnly.reduce((s, i) => s + parts[i].percentOfNet!, 0);
    if (pctSum <= 0) {
      throw new BadRequestException('Indique porcentaje o monto en cada parte de pago.');
    }
    for (const i of percentOnly) {
      amounts[i] = roundMoney(remaining * (parts[i].percentOfNet! / pctSum));
    }
  }

  const unset = amounts
    .map((v, i) => (Number.isNaN(v) ? i : -1))
    .filter((i) => i >= 0);
  if (unset.length) {
    const used = amounts
      .filter((v) => !Number.isNaN(v))
      .reduce((s, v) => s + v, 0);
    const each = roundMoney(Math.max(0, net - used) / unset.length);
    for (const i of unset) amounts[i] = each;
  }

  const total = roundMoney(amounts.reduce((s, v) => s + v, 0));
  const diff = roundMoney(net - total);
  if (diff !== 0 && amounts.length) {
    amounts[amounts.length - 1] = roundMoney(amounts[amounts.length - 1] + diff);
  }

  return parts.map((p, i) => ({
    partNumber: i + 1,
    label: p.label?.trim() || null,
    amount: amounts[i] ?? 0,
    dueDate: parseDueDate(p.dueDate),
  }));
}

export function assertPaymentPartsMatchNet(
  net: number,
  parts: { amount: number }[],
): void {
  const sum = roundMoney(parts.reduce((s, p) => s + p.amount, 0));
  if (Math.abs(sum - net) > 0.02) {
    throw new BadRequestException(
      `Las partes de pago deben sumar el neto a pagar (S/ ${net}). Suma actual: S/ ${sum}.`,
    );
  }
}

export function assertValidDeductibleType(type: string): SaleCommissionDeductibleType {
  const t = type?.trim().toUpperCase();
  if (!(SALE_COMMISSION_DEDUCTIBLE_TYPES as readonly string[]).includes(t)) {
    throw new BadRequestException(
      `Tipo de deducible inválido. Use: ${SALE_COMMISSION_DEDUCTIBLE_TYPES.join(', ')}`,
    );
  }
  return t as SaleCommissionDeductibleType;
}

export async function scaleCommissionPaymentPartsToNet(
  tx: Prisma.TransactionClient,
  commissionId: string,
  newNet: number,
): Promise<void> {
  const parts = await tx.saleCommissionPaymentPart.findMany({
    where: { saleCommissionId: commissionId },
    orderBy: { partNumber: 'asc' },
  });
  if (!parts.length) return;

  const oldSum = parts.reduce((s, p) => s + p.amount, 0);
  if (oldSum <= 0) {
    const each = roundMoney(newNet / parts.length);
    for (let i = 0; i < parts.length; i++) {
      const amt =
        i === parts.length - 1
          ? roundMoney(newNet - each * (parts.length - 1))
          : each;
      await tx.saleCommissionPaymentPart.update({
        where: { id: parts[i].id },
        data: { amount: amt },
      });
    }
    return;
  }

  const scaled: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    scaled.push(roundMoney((parts[i].amount / oldSum) * newNet));
  }
  const diff = roundMoney(newNet - scaled.reduce((s, v) => s + v, 0));
  if (diff !== 0) scaled[scaled.length - 1] = roundMoney(scaled[scaled.length - 1] + diff);

  for (let i = 0; i < parts.length; i++) {
    await tx.saleCommissionPaymentPart.update({
      where: { id: parts[i].id },
      data: { amount: scaled[i] },
    });
  }
}

export async function syncSaleCommissionStatus(
  db: Prisma.TransactionClient,
  commissionId: string,
): Promise<void> {
  const parts = await db.saleCommissionPaymentPart.findMany({
    where: { saleCommissionId: commissionId },
  });
  if (!parts.length) return;

  const paidCount = parts.filter((p) => p.status === 'PAID').length;
  let status = 'PENDING';
  if (paidCount === parts.length) status = 'PAID';
  else if (paidCount > 0) status = 'PARTIAL';

  const paidAt =
    status === 'PAID'
      ? parts
          .map((p) => p.paidAt)
          .filter((d): d is Date => d != null)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? new Date()
      : null;

  await db.saleCommission.update({
    where: { id: commissionId },
    data: { status, paidAt },
  });
}

export function mapCommissionEnrichment(row: {
  amount: number;
  deductibles?: { amount: number }[];
  paymentParts?: unknown[];
}) {
  const deductiblesTotal = sumDeductibles(row.deductibles ?? []);
  const grossAmount = roundMoney(Number(row.amount));
  const netPayable = Math.max(0, roundMoney(grossAmount - deductiblesTotal));
  return {
    grossAmount,
    deductiblesTotal,
    netPayable,
  };
}
