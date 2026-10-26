import type { RentalFinancialCurrencyTotals } from '../utils/rental-financial-breakdown.util';

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
    public readonly startDate: Date,
    public readonly currency: string,
    public readonly monthlyAmount: number,
  ) {}
}

export class PropertyWithoutContractItem {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly addressLine: string,
    public readonly ownerName: string,
    public readonly propertyType: string,
    public readonly district: string | null,
    /** Renta de referencia de la propiedad */
    public readonly monthlyRent: number | null,
    public readonly rentCurrency: string,
    public readonly listingStatus: string | null,
    /** Fin del último contrato (null si nunca tuvo uno) */
    public readonly lastContractEndDate: Date | null,
  ) {}
}

/** Contrato vigente de un cliente activo. */
export class ActiveClientContract {
  constructor(
    public readonly rentalId: string,
    public readonly code: string,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly daysLeft: number,
    public readonly currency: string,
    public readonly monthlyAmount: number,
    /** Titular del contrato o co-inquilino */
    public readonly isPrimaryTenant: boolean,
  ) {}
}

export class ActiveClientReportItem {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly contractsCount: number,
    public readonly documentNumber: string | null,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly contracts: ActiveClientContract[],
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

/** Comisiones cobradas en el mes, en una sola moneda (sin conversión entre monedas). */
export class RentalsByMonthCurrencyTotals {
  constructor(
    public readonly currency: string,
    /** Comisiones cobradas (alquileres con cobro en el período) */
    public readonly collectedCommissions: number,
    /** Renta mensual de esos alquileres */
    public readonly totalRevenue: number,
    /** Ingreso de la distribución financiera (la comisión de la inmobiliaria) */
    public readonly companyRevenue: number,
    public readonly totalExpense: number,
    public readonly totalTax: number,
    public readonly totalExternalCommission: number,
    public readonly totalInternalCommission: number,
    public readonly totalUtility: number,
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
    /** Totales por moneda según la fecha efectiva de cobro de la comisión */
    public readonly totalsByCurrency: RentalsByMonthCurrencyTotals[],
  ) {}
}

/** Comisión (ingreso) de un alquiler y su seguimiento de cobro. */
export class RentalCommissionItem {
  constructor(
    public readonly rentalId: string,
    public readonly rentalCode: string,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly tenantName: string,
    public readonly rentalStatus: string,
    public readonly contractStartDate: string,
    public readonly currency: string,
    public readonly amount: number,
    public readonly status: string,
    public readonly dueDate: string | null,
    public readonly paidDate: string | null,
    /** Pendiente con fecha estimada ya pasada */
    public readonly isOverdue: boolean,
  ) {}
}

export class RentalCommissionCurrencyTotals {
  constructor(
    public readonly currency: string,
    public readonly pendingCount: number,
    public readonly pendingAmount: number,
    public readonly paidCount: number,
    public readonly paidAmount: number,
  ) {}
}

export class RentalCommissionsList {
  constructor(
    /** Página pedida */
    public readonly items: RentalCommissionItem[],
    /** Totales de todas las comisiones del filtro (no solo la página) */
    public readonly totalsByCurrency: RentalCommissionCurrencyTotals[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
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
    public readonly contractStartDate: string,
    public readonly commissionStatus: string,
    public readonly commissionPaidDate: string | null,
    /** Montos fijos en otra moneda (p. ej. agente en S/ de un contrato en US$); se suman en su moneda */
    public readonly otherCurrencyTotals: RentalFinancialCurrencyTotals[] = [],
  ) {}
}
