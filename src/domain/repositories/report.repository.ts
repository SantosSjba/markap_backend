import type {
  ReportsSummary,
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  ContractStatusSummary,
  MonthlyMetrics,
  RentalsByMonthItem,
  FinancialDistributionReportItem,
} from '@domain/entities/report.entity';

export type {
  ReportsSummary,
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  ContractStatusSummary,
  MonthlyMetrics,
  RentalsByMonthItem,
  FinancialDistributionReportItem,
} from '@domain/entities/report.entity';

export const REPORT_REPOSITORY = Symbol('ReportRepository');

export interface ReportRepository {
  getSummary(applicationSlug: string, days: number): Promise<ReportsSummary>;
  getContractsExpiring(applicationSlug: string, days: number): Promise<ContractExpiringItem[]>;
  getPropertiesWithoutContract(applicationSlug: string): Promise<PropertyWithoutContractItem[]>;
  getActiveClients(applicationSlug: string): Promise<ActiveClientReportItem[]>;
  getContractStatusSummary(applicationSlug: string): Promise<ContractStatusSummary>;
  getMonthlyMetrics(applicationSlug: string): Promise<MonthlyMetrics>;
  getRentalsByMonth(
    applicationSlug: string,
    year: number,
    month?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RentalsByMonthItem[]>;
  getFinancialDistributionReport(
    applicationSlug: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialDistributionReportItem[]>;
}
