/** Resumen numérico de indicadores de reportes. */
export class ReportsSummary {
  constructor(
    public readonly contratosPorVencer: number,
    public readonly propiedadesSinContrato: number,
    public readonly clientesActivos: number,
    public readonly clientesConIncidencias: number,
  ) {}
}

export class ContractExpiringItem {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly tenantName: string,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly endDate: Date,
    public readonly daysLeft: number,
  ) {}
}

export class PropertyWithoutContractItem {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly addressLine: string,
    public readonly ownerName: string,
  ) {}
}

export class ActiveClientReportItem {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly contractsCount: number,
  ) {}
}

export class ContractStatusSummary {
  constructor(
    public readonly vigentes: number,
    public readonly porVencer: number,
    public readonly proximos: number,
    public readonly urgentes: number,
  ) {}
}

export class MonthlyMetrics {
  constructor(
    public readonly tasaOcupacion: number,
    public readonly tasaCobranza: number,
    public readonly contratosRenovados: number,
    public readonly clientesNuevos: number,
  ) {}
}

export class RentalsByMonthItem {
  constructor(
    public readonly month: number,
    public readonly year: number,
    public readonly monthName: string,
    public readonly newContracts: number,
    public readonly expiredContracts: number,
    public readonly activeAtEndOfMonth: number,
    public readonly totalRevenue: number,
    public readonly companyRevenue: number,
    public readonly totalExpense: number,
    public readonly totalTax: number,
    public readonly totalExternalCommission: number,
    public readonly totalInternalCommission: number,
    public readonly totalUtility: number,
    public readonly currency: string,
  ) {}
}

export class FinancialDistributionReportItem {
  constructor(
    public readonly rentalId: string,
    public readonly rentalCode: string,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly tenantName: string,
    public readonly currency: string,
    public readonly baseAmount: number,
    public readonly monthlyAmount: number,
    public readonly expense: number,
    public readonly tax: number,
    public readonly externalAgentCommission: number,
    public readonly internalAgentCommission: number,
    public readonly utility: number,
    public readonly externalAgentName: string | null,
    public readonly internalAgentName: string | null,
    public readonly status: string,
  ) {}
}
