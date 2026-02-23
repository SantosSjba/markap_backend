export interface ReportsSummary {
  contratosPorVencer: number;
  propiedadesSinContrato: number;
  clientesActivos: number;
  clientesConIncidencias: number;
}

export interface ContractExpiringItem {
  id: string;
  code: string;
  tenantName: string;
  propertyAddress: string;
  ownerName: string;
  endDate: Date;
  daysLeft: number;
}

export interface PropertyWithoutContractItem {
  id: string;
  code: string;
  addressLine: string;
  ownerName: string;
}

export interface ActiveClientReportItem {
  id: string;
  fullName: string;
  contractsCount: number;
}

export interface ContractStatusSummary {
  vigentes: number;
  porVencer: number;
  proximos: number;
  urgentes: number;
}

export interface MonthlyMetrics {
  tasaOcupacion: number;
  tasaCobranza: number;
  contratosRenovados: number;
  clientesNuevos: number;
}

export interface RentalsByMonthItem {
  month: number;
  year: number;
  monthName: string;
  newContracts: number;
  expiredContracts: number;
  activeAtEndOfMonth: number;
  totalRevenue: number;
  currency: string;
}

export interface ReportRepository {
  getSummary(applicationSlug: string, days: number): Promise<ReportsSummary>;
  getContractsExpiring(applicationSlug: string, days: number): Promise<ContractExpiringItem[]>;
  getPropertiesWithoutContract(applicationSlug: string): Promise<PropertyWithoutContractItem[]>;
  getActiveClients(applicationSlug: string): Promise<ActiveClientReportItem[]>;
  getContractStatusSummary(applicationSlug: string): Promise<ContractStatusSummary>;
  getMonthlyMetrics(applicationSlug: string): Promise<MonthlyMetrics>;
  getRentalsByMonth(applicationSlug: string, year: number): Promise<RentalsByMonthItem[]>;
}

export const REPORT_REPOSITORY = Symbol('ReportRepository');
