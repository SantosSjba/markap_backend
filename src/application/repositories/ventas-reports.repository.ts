export const VENTAS_REPORTS_GRANULARITY = ['day', 'week', 'month'] as const;
export type VentasReportsGranularity = (typeof VENTAS_REPORTS_GRANULARITY)[number];

export interface VentasReportsDateRange {
  applicationId: string;
  startDate: Date;
  endDate: Date;
}

export interface SalesByPeriodRow {
  period: string;
  closingsCount: number;
  totalAmount: number;
}

export interface AgentPerformanceRow {
  agentId: string;
  agentName: string;
  closingsCount: number;
  totalSales: number;
  totalCommissionAmount: number;
}

export interface ConversionReport {
  opportunitiesCreated: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  separationsCreated: number;
  closingsCount: number;
  conversionRatePercent: number;
  activePipelineByStage: Record<string, number>;
}

export interface FinancialFlowReport {
  buyerPaymentsCollected: number;
  buyerPaymentsPending: number;
  documentationCostsTotal: number;
  commissionsPaidAmount: number;
  commissionsPendingAmount: number;
  estimatedNetAfterCosts: number;
}

export const VENTAS_REPORTS_REPOSITORY = Symbol('VentasReportsRepository');

export interface VentasReportsRepository {
  getSalesByPeriod(
    range: VentasReportsDateRange,
    granularity: VentasReportsGranularity,
  ): Promise<SalesByPeriodRow[]>;

  getAgentPerformance(range: VentasReportsDateRange): Promise<AgentPerformanceRow[]>;

  getConversion(range: VentasReportsDateRange): Promise<ConversionReport>;

  getFinancialFlow(range: VentasReportsDateRange): Promise<FinancialFlowReport>;
}
