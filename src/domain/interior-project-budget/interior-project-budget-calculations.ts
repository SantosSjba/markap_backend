/**
 * Cálculos del presupuesto por proyecto (modelo Excel Carolina Zavala).
 * Los montos derivados no se persisten en BD.
 */

export interface LineItemPricingInput {
  budgetedCost: number;
  hasIgv: boolean;
  utilityPct: number;
  igvPct: number;
}

export interface LineItemPricingResult {
  utilityAmount: number;
  totalBeforeIgv: number;
  igvAmount: number;
  price: number;
}

export interface SupplierPaymentInput {
  amount: number;
}

export interface LineItemPurchaseInput {
  actualPurchaseCost: number | null;
  supplierPayments: SupplierPaymentInput[];
}

export interface LineItemPurchaseResult {
  totalSupplierPayments: number;
  supplierBalance: number | null;
  /** costo presupuestado − costo real (columna "Utilidad extra emergencia") */
  emergencyUtilityAmount: number | null;
}

export interface ClientPaymentInput {
  amount: number;
  paymentType: string;
  status: string;
}

export interface ProjectSettlementInput {
  lineItemPrices: number[];
  lineItemActualCosts: Array<number | null>;
  clientPayments: ClientPaymentInput[];
}

export interface ProjectSettlementResult {
  budgetTotal: number;
  igvTotal: number;
  totalActualCost: number;
  totalSupplierPayments: number;
  depositsOnAccount: number;
  totalClientPaid: number;
  pendingToCollect: number;
  milestoneUtility: number;
}

const PAID_STATUSES = new Set(['PAID']);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeLineItemPricing(input: LineItemPricingInput): LineItemPricingResult {
  const budgetedCost = Number(input.budgetedCost) || 0;
  const utilityPct = Number(input.utilityPct) || 0;
  const igvPct = Number(input.igvPct) || 0;

  const utilityAmount = round2(budgetedCost * (utilityPct / 100));
  const totalBeforeIgv = round2(budgetedCost + utilityAmount);
  const igvAmount = input.hasIgv ? round2(totalBeforeIgv * (igvPct / 100)) : 0;
  const price = round2(totalBeforeIgv + igvAmount);

  return { utilityAmount, totalBeforeIgv, igvAmount, price };
}

export function computeLineItemPurchase(input: LineItemPurchaseInput): LineItemPurchaseResult {
  const totalSupplierPayments = round2(
    input.supplierPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  );

  if (input.actualPurchaseCost == null) {
    return {
      totalSupplierPayments,
      supplierBalance: null,
      emergencyUtilityAmount: null,
    };
  }

  const actual = Number(input.actualPurchaseCost) || 0;
  return {
    totalSupplierPayments,
    supplierBalance: round2(actual - totalSupplierPayments),
    emergencyUtilityAmount: null,
  };
}

export function computeEmergencyUtility(
  budgetedCost: number | null,
  actualPurchaseCost: number | null,
): number | null {
  if (budgetedCost == null || actualPurchaseCost == null) return null;
  return round2(Number(budgetedCost) - Number(actualPurchaseCost));
}

export function computeProjectSettlement(input: ProjectSettlementInput): ProjectSettlementResult {
  const budgetTotal = round2(
    input.lineItemPrices.reduce((sum, price) => sum + (Number(price) || 0), 0),
  );
  const igvTotal = 0; // derivado por línea si se necesita desglose en UI

  const totalActualCost = round2(
    input.lineItemActualCosts.reduce<number>(
      (sum, cost) => sum + (cost == null ? 0 : Number(cost) || 0),
      0,
    ),
  );

  const paidPayments = input.clientPayments.filter((p) => PAID_STATUSES.has(p.status));
  const depositsOnAccount = round2(
    paidPayments
      .filter((p) => p.paymentType === 'ABONO')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  );
  const totalClientPaid = round2(
    paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  );

  return {
    budgetTotal,
    igvTotal,
    totalActualCost,
    totalSupplierPayments: 0,
    depositsOnAccount,
    totalClientPaid,
    pendingToCollect: round2(budgetTotal - totalClientPaid),
    milestoneUtility: round2(budgetTotal - totalActualCost),
  };
}
