export const VENTAS_REPORTS_GRANULARITY = ['day', 'week', 'month'] as const;
export type VentasReportsGranularity = (typeof VENTAS_REPORTS_GRANULARITY)[number];

export interface VentasReportsDateRange {
  applicationId: string;
  startDate: Date;
  endDate: Date;
}

export class SalesByPeriodRow {
  constructor(
    public readonly period: string,
    public readonly closingsCount: number,
    public readonly totalAmount: number,
  ) {}
}

export class AgentPerformanceRow {
  constructor(
    public readonly agentId: string,
    public readonly agentName: string,
    public readonly closingsCount: number,
    public readonly totalSales: number,
    public readonly totalCommissionAmount: number,
  ) {}
}

export class ConversionReport {
  constructor(
    public readonly opportunitiesCreated: number,
    public readonly opportunitiesWon: number,
    public readonly opportunitiesLost: number,
    public readonly separationsCreated: number,
    public readonly closingsCount: number,
    public readonly conversionRatePercent: number,
    public readonly activePipelineByStage: Record<string, number>,
  ) {}
}

export class FinancialFlowReport {
  constructor(
    public readonly buyerPaymentsCollected: number,
    public readonly buyerPaymentsPending: number,
    public readonly documentationCostsTotal: number,
    public readonly commissionsPaidAmount: number,
    public readonly commissionsPendingAmount: number,
    public readonly estimatedNetAfterCosts: number,
  ) {}
}
