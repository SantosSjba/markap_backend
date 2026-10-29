import { round2, type BudgetCurrencyAmount } from './budget-sheet.calculator';

/**
 * Liquidación del proyecto en la moneda del presupuesto.
 *
 * Los cobros en otra moneda se convierten con el tipo de cambio del cobro o, si no tiene, con el
 * del presupuesto (soles por unidad de moneda extranjera). Sin tipo de cambio aplicable el cobro
 * queda «sin convertir»: se informa aparte y no descuenta el saldo, nunca se mezclan monedas.
 */

export interface SettlementPaymentInput {
  amount: number;
  /** null = moneda del presupuesto (cobros anteriores a la moneda por cobro) */
  currency: string | null;
  exchangeRate: number | null;
  paymentType: string;
  status: string;
}

export interface ProjectSettlementResult {
  currency: string;
  budgetTotal: number;
  igvTotal: number;
  depositsOnAccount: number;
  totalClientPaid: number;
  pendingToCollect: number;
  /** Cobros programados aún no confirmados */
  scheduledPayments: number;
  totalActualCost: number;
  totalSupplierPayments: number;
  supplierBalance: number;
  /** Ingreso sin IGV (total − IGV): el IGV se paga a SUNAT, no es ingreso del proyecto */
  netRevenue: number;
  /** Costo presupuestado de las partidas que aún no tienen costo real */
  pendingCost: number;
  /**
   * Utilidad estimada = ingreso sin IGV − (costo real + costo presupuestado de lo que aún no
   * tiene costo real). Al registrar todos los costos reales queda la utilidad final.
   */
  milestoneUtility: number;
  /** Utilidad / ingreso sin IGV × 100; null sin presupuesto */
  marginPct: number | null;
  /** Cobros confirmados en su moneda original (solo los de otra moneda) */
  paidByCurrency: BudgetCurrencyAmount[];
  unconverted: BudgetCurrencyAmount[];
}

const PEN = 'PEN';

/** Monto en la moneda del presupuesto, o null si no hay tipo de cambio aplicable */
function convert(
  amount: number,
  from: string,
  to: string,
  rate: number | null,
): number | null {
  if (from === to) return amount;
  if (!rate || rate <= 0) return null;
  if (to === PEN) return amount * rate;
  if (from === PEN) return amount / rate;
  return null;
}

function addTo(list: BudgetCurrencyAmount[], currency: string, amount: number) {
  const item = list.find((x) => x.currency === currency);
  if (item) item.amount = round2(item.amount + amount);
  else list.push({ currency, amount: round2(amount) });
}

export function computeProjectSettlement(
  totals: {
    total: number;
    igv: number;
    actualCost: number;
    /** Costo presupuestado de partidas sin costo real (0 si no se informa) */
    pendingCost?: number;
    supplierPayments: number;
    /** Saldo de partidas con proveedor identificado o abonos ya registrados. */
    supplierBalance?: number;
  },
  budget: { currency: string; exchangeRate: number | null },
  payments: SettlementPaymentInput[],
): ProjectSettlementResult {
  let paid = 0;
  let deposits = 0;
  let scheduled = 0;
  const paidByCurrency: BudgetCurrencyAmount[] = [];
  const unconverted: BudgetCurrencyAmount[] = [];

  for (const p of payments) {
    if (p.status !== 'PAID' && p.status !== 'PENDING') continue;
    const currency = p.currency || budget.currency;
    const value = convert(
      p.amount,
      currency,
      budget.currency,
      p.exchangeRate ?? budget.exchangeRate,
    );
    if (p.status === 'PENDING') {
      if (value !== null) scheduled += value;
      continue;
    }
    if (value === null) {
      addTo(unconverted, currency, p.amount);
      continue;
    }
    if (currency !== budget.currency) addTo(paidByCurrency, currency, p.amount);
    paid += value;
    if (p.paymentType === 'ABONO') deposits += value;
  }

  const netRevenue = round2(totals.total - totals.igv);
  const pendingCost = round2(totals.pendingCost ?? 0);
  const utility = round2(netRevenue - totals.actualCost - pendingCost);
  return {
    currency: budget.currency,
    budgetTotal: totals.total,
    igvTotal: totals.igv,
    depositsOnAccount: round2(deposits),
    totalClientPaid: round2(paid),
    pendingToCollect: round2(totals.total - paid),
    scheduledPayments: round2(scheduled),
    totalActualCost: totals.actualCost,
    totalSupplierPayments: totals.supplierPayments,
    supplierBalance: round2(
      totals.supplierBalance ?? totals.actualCost - totals.supplierPayments,
    ),
    netRevenue,
    pendingCost,
    milestoneUtility: utility,
    marginPct: netRevenue > 0 ? round2((utility / netRevenue) * 100) : null,
    paidByCurrency,
    unconverted,
  };
}
