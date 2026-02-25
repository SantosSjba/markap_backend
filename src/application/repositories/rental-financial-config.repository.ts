/**
 * Configuración financiera de un alquiler: gastos, impuestos, agentes, utilidad.
 */
export type FinancialValueType = 'PERCENT' | 'FIXED';

export interface RentalFinancialConfigData {
  id: string;
  rentalId: string;
  currency: string;
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

/** Desglose calculado para un monto mensual */
export interface RentalFinancialBreakdown {
  monthlyAmount: number;
  currency: string;
  expense: number;
  tax: number;
  externalAgentCommission: number;
  internalAgentCommission: number;
  /** Utilidad neta = monthlyAmount - expense - tax - externalAgent - internalAgent */
  utility: number;
  config: RentalFinancialConfigData | null;
}

export const RENTAL_FINANCIAL_CONFIG_REPOSITORY = Symbol('RentalFinancialConfigRepository');

export interface RentalFinancialConfigRepository {
  findByRentalId(rentalId: string): Promise<RentalFinancialConfigData | null>;
  upsert(data: CreateOrUpdateRentalFinancialConfigData): Promise<RentalFinancialConfigData>;
  getBreakdown(rentalId: string, monthlyAmount: number, currency: string): Promise<RentalFinancialBreakdown>;
}
