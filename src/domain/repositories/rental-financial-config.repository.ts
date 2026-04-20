import type {
  FinancialValueType,
  RentalFinancialConfig,
  RentalFinancialBreakdown,
} from '@domain/entities/rental-financial-config.entity';

export type {
  FinancialValueType,
  RentalFinancialConfig,
  RentalFinancialBreakdown,
} from '@domain/entities/rental-financial-config.entity';

export interface CreateOrUpdateRentalFinancialConfigData {
  rentalId: string;
  currency?: string;
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

export const RENTAL_FINANCIAL_CONFIG_REPOSITORY = Symbol('RentalFinancialConfigRepository');

export interface RentalFinancialConfigRepository {
  findByRentalId(rentalId: string): Promise<RentalFinancialConfig | null>;
  upsert(data: CreateOrUpdateRentalFinancialConfigData): Promise<RentalFinancialConfig>;
  getBreakdown(rentalId: string, monthlyAmount: number, currency: string): Promise<RentalFinancialBreakdown>;
}
