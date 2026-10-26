import type {
  ActiveClientReportItem,
  ContractExpiringItem,
  ContractStatusSummary,
  FinancialDistributionReportItem,
  MonthlyMetrics,
  PropertyWithoutContractItem,
  RentalCommissionsList,
  RentalsByMonthItem,
  ReportsSummary,
} from '../entities/report.entity';

export type {
  ActiveClientReportItem,
  ContractExpiringItem,
  ContractStatusSummary,
  FinancialDistributionReportItem,
  MonthlyMetrics,
  PropertyWithoutContractItem,
  RentalCommissionsList,
  RentalsByMonthItem,
  ReportsSummary,
} from '../entities/report.entity';

/** Fecha con la que se filtra el reporte: inicio del contrato o cobro de la comisión. */
export type FinancialDistributionDateField = 'startDate' | 'commissionPaidDate';

export interface ListRentalCommissionsFilters {
  applicationSlug: string;
  status?: 'PENDING' | 'PAID';
  search?: string;
}

export const REPORT_REPOSITORY = Symbol('ReportRepository');

export interface ReportRepository {
  getSummary(applicationSlug: string, days: number): Promise<ReportsSummary>;
  getContractsExpiring(
    applicationSlug: string,
    days: number,
  ): Promise<ContractExpiringItem[]>;
  getPropertiesWithoutContract(
    applicationSlug: string,
  ): Promise<PropertyWithoutContractItem[]>;
  getActiveClients(applicationSlug: string): Promise<ActiveClientReportItem[]>;
  getContractStatusSummary(
    applicationSlug: string,
  ): Promise<ContractStatusSummary>;
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
    dateField?: FinancialDistributionDateField,
  ): Promise<FinancialDistributionReportItem[]>;
  listCommissions(
    filters: ListRentalCommissionsFilters,
  ): Promise<RentalCommissionsList>;
}
