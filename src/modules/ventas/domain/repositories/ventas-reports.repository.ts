export { VENTAS_REPORTS_GRANULARITY } from '../entities/ventas-reports.entity';
export type {
  AgentPerformanceRow,
  ConversionReport,
  FinancialFlowReport,
  SalesByPeriodRow,
  VentasReportsDateRange,
  VentasReportsGranularity,
} from '../entities/ventas-reports.entity';

import type {
  AgentPerformanceRow,
  ConversionReport,
  FinancialFlowReport,
  SalesByPeriodRow,
  VentasReportsDateRange,
  VentasReportsGranularity,
} from '../entities/ventas-reports.entity';

export const VENTAS_REPORTS_REPOSITORY = Symbol('VentasReportsRepository');

export interface VentasReportsRepository {
  getSalesByPeriod(
    range: VentasReportsDateRange,
    granularity: VentasReportsGranularity,
  ): Promise<SalesByPeriodRow[]>;

  getAgentPerformance(
    range: VentasReportsDateRange,
  ): Promise<AgentPerformanceRow[]>;

  getConversion(range: VentasReportsDateRange): Promise<ConversionReport>;

  getFinancialFlow(range: VentasReportsDateRange): Promise<FinancialFlowReport>;
}
