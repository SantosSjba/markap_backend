/**
 * Resúmenes de Reportes de Ventas. Los montos van siempre agrupados por moneda:
 * nunca se suman soles, dólares y euros en una misma cifra.
 */

/** Agrupación del detalle por periodo: mes (`2026-03`) o año (`2026`) */
export type VentasSummaryGranularity = 'month' | 'year';

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface SalesSummaryCurrencyTotals {
  currency: string;
  count: number;
  total: number;
  average: number;
  /** Suma de los precios de lista de lo vendido */
  listTotal: number;
  /** Descuento promedio frente al precio de lista (%; negativo si se vendió por encima) */
  discountPercent: number;
}

export interface SalesSummaryClosing {
  id: string;
  closedAt: Date;
  processId: string | null;
  processCode: string | null;
  propertyCode: string;
  propertyAddress: string;
  propertyType: string | null;
  buyerName: string;
  agentName: string | null;
  finalPrice: number;
  listPrice: number | null;
  currency: string;
  paymentType: string;
  /** Días desde que se abrió el proceso hasta el cierre */
  daysToClose: number | null;
  /** Periodo de la venta (hora de Lima): `2026-03` o `2026` */
  period: string;
  /** Comisiones de asesores de la venta (neto), cada una en su moneda */
  commissions: {
    agentName: string;
    currency: string;
    total: number;
    paid: number;
  }[];
}

export interface SalesSummary {
  closings: number;
  byCurrency: SalesSummaryCurrencyTotals[];
  periods: {
    period: string;
    closings: number;
    byCurrency: { currency: string; count: number; total: number }[];
  }[];
  rows: SalesSummaryClosing[];
}

export interface AgentsSummaryRow {
  agentId: string;
  agentName: string;
  agentType: string | null;
  processesCreated: number;
  activeProcesses: number;
  won: number;
  lost: number;
  /** Ganados / (ganados + caídos) en el periodo */
  winRate: number;
  sales: { currency: string; count: number; total: number }[];
  commissions: {
    currency: string;
    total: number;
    paid: number;
    pending: number;
  }[];
}

export interface AgentsSummary {
  agents: AgentsSummaryRow[];
}

export interface ConversionSummary {
  created: number;
  won: number;
  lost: number;
  /** Procesos activos hoy (embudo actual) */
  active: number;
  separations: number;
  /** Ganados / procesos creados en el periodo */
  conversionRate: number;
  /** Ganados / (ganados + caídos) */
  winRate: number;
  avgDaysToClose: number | null;
  stages: { stage: string; count: number; value: CurrencyAmount[] }[];
  periods: { period: string; created: number; won: number; lost: number }[];
  lostReasons: { reason: string; count: number }[];
}

export interface FinancialSummaryCurrency {
  currency: string;
  /** Precio final de las ventas cerradas */
  salesVolume: number;
  /** Separaciones recibidas (dinero de reserva) */
  separations: number;
  /** Comisiones de asesores (neto) de las ventas cerradas */
  commissionsGenerated: number;
  /** Comisiones pagadas en el periodo */
  commissionsPaid: number;
  /** Comisiones aún por pagar (de las ventas del periodo) */
  commissionsPending: number;
  documentationCosts: number;
  buyerPaymentsCollected: number;
  buyerPaymentsPending: number;
}

export interface FinancialSummary {
  byCurrency: FinancialSummaryCurrency[];
  periods: {
    period: string;
    byCurrency: {
      currency: string;
      sales: number;
      separations: number;
      commissionsPaid: number;
      costs: number;
    }[];
  }[];
}
