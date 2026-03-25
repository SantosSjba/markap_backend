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
  /** Suma de monthlyAmount del contrato (valor acordado con el inquilino) */
  totalRevenue: number;
  /** Suma del monto real que recibe la empresa: baseAmount de config si existe, sino monthlyAmount */
  companyRevenue: number;
  /** Suma total de gastos de los contratos concretados en el mes */
  totalExpense: number;
  /** Suma total de impuestos de los contratos concretados en el mes */
  totalTax: number;
  /** Suma total de comisiones de agente externo */
  totalExternalCommission: number;
  /** Suma total de comisiones de agente interno */
  totalInternalCommission: number;
  /** Suma de utilidades netas (propietario) de los contratos concretados en el mes */
  totalUtility: number;
  currency: string;
}

export interface FinancialDistributionReportItem {
  rentalId: string;
  rentalCode: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  currency: string;
  /** Monto ingresado (base_amount si existe, sino monthly_amount del contrato) */
  baseAmount: number;
  /** Monto mensual del contrato */
  monthlyAmount: number;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  utility: number;
  /** Nombre del agente externo (si aplica) */
  externalAgentName: string | null;
  /** Nombre del agente interno (si aplica) */
  internalAgentName: string | null;
  status: string;
}

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

export const REPORT_REPOSITORY = Symbol('ReportRepository');
