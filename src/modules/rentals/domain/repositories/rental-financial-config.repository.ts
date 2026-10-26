import type {
  FinancialValueType,
  RentalFinancialBreakdown,
  RentalFinancialConfig,
} from '../entities/rental-financial-config.entity';

export type {
  FinancialValueType,
  RentalFinancialBreakdown,
  RentalFinancialConfig,
} from '../entities/rental-financial-config.entity';

export interface CreateOrUpdateRentalFinancialConfigData {
  rentalId: string;
  currency?: string;
  baseAmount?: number | null;
  expenseType?: FinancialValueType;
  expenseValue?: number;
  expenseDetail?: string | null;
  expenseCurrency?: string | null;
  taxType?: FinancialValueType;
  taxValue?: number;
  taxDetail?: string | null;
  taxCurrency?: string | null;
  externalAgentId?: string | null;
  externalAgentType?: FinancialValueType;
  externalAgentValue?: number;
  externalAgentName?: string | null;
  externalAgentCurrency?: string | null;
  internalAgentId?: string | null;
  internalAgentType?: FinancialValueType;
  internalAgentValue?: number;
  internalAgentName?: string | null;
  internalAgentCurrency?: string | null;
}

export const RENTAL_FINANCIAL_CONFIG_REPOSITORY = Symbol(
  'RentalFinancialConfigRepository',
);

export interface RentalFinancialConfigRepository {
  findByRentalId(rentalId: string): Promise<RentalFinancialConfig | null>;
  upsert(
    data: CreateOrUpdateRentalFinancialConfigData,
  ): Promise<RentalFinancialConfig>;
  getBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown>;
}
