export { VENTAS_REPORTS_GRANULARITY } from '@domain/entities/ventas-reports.entity';
export type {
  VentasReportsDateRange,
  VentasReportsGranularity,
  SalesByPeriodRow,
  AgentPerformanceRow,
  ConversionReport,
  FinancialFlowReport,
} from '@domain/entities/ventas-reports.entity';

import type {
  VentasReportsDateRange,
  VentasReportsGranularity,
  SalesByPeriodRow,
  AgentPerformanceRow,
  ConversionReport,
  FinancialFlowReport,
} from '@domain/entities/ventas-reports.entity';

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
