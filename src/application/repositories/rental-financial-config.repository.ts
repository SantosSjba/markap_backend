/**
 * Configuración financiera de un alquiler: gastos, impuestos, agentes, utilidad.
 */
export type FinancialValueType = 'PERCENT' | 'FIXED';

export interface RentalFinancialConfigData {
  id: string;
  rentalId: string;
  currency: string;
  /** Monto ingresado al concretar el alquiler. Si es null se usa monthlyAmount del contrato. */
  baseAmount: number | null;
  expenseType: FinancialValueType;
  expenseValue: number;
  taxType: FinancialValueType;
  taxValue: number;
  externalAgentId: string | null;
  externalAgentType: FinancialValueType;
  externalAgentValue: number;
  externalAgentName: string | null;
  internalAgentId: string | null;
  internalAgentType: FinancialValueType;
  internalAgentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrUpdateRentalFinancialConfigData {
  rentalId: string;
  currency?: string;
  /** Monto ingresado al concretar el alquiler (base para descuentos). null = usar monthlyAmount. */
  baseAmount?: number | null;
  expenseType?: FinancialValueType;
  expenseValue?: number;
  taxType?: FinancialValueType;
  taxValue?: number;
  externalAgentId?: string | null;
  externalAgentType?: FinancialValueType;
  externalAgentValue?: number;
  externalAgentName?: string | null;
  internalAgentId?: string | null;
  internalAgentType?: FinancialValueType;
  internalAgentValue?: number;
}

/** Desglose calculado del monto ingresado */
export interface RentalFinancialBreakdown {
  /** Monto del contrato (monthlyAmount del Rental) */
  monthlyAmount: number;
  /** Monto base efectivamente usado para el cálculo (baseAmount de config o monthlyAmount) */
  baseAmount: number;
  currency: string;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  /** Utilidad neta = baseAmount - expense - tax - externalAgent - internalAgent */
  utility: number;
  config: RentalFinancialConfigData | null;
}

export const RENTAL_FINANCIAL_CONFIG_REPOSITORY = Symbol('RentalFinancialConfigRepository');

export interface RentalFinancialConfigRepository {
  findByRentalId(rentalId: string): Promise<RentalFinancialConfigData | null>;
  upsert(data: CreateOrUpdateRentalFinancialConfigData): Promise<RentalFinancialConfigData>;
  getBreakdown(rentalId: string, monthlyAmount: number, currency: string): Promise<RentalFinancialBreakdown>;
}
