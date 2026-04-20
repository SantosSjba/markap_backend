import type { FinancialValueType } from '@domain/entities/rental-financial-config.entity';
import { RentalFinancialConfig } from '@domain/entities/rental-financial-config.entity';

export class RentalFinancialConfigPrismaMapper {
  static toDomain(row: {
    id: string;
    rentalId: string;
    currency: string;
    baseAmount?: number | null;
    expenseType: string;
    expenseValue: number | { toNumber?: () => number };
    taxType: string;
    taxValue: number | { toNumber?: () => number };
    externalAgentId: string | null;
    externalAgentType: string;
    externalAgentValue: number | { toNumber?: () => number };
    externalAgentName: string | null;
    internalAgentId: string | null;
    internalAgentType: string;
    internalAgentValue: number | { toNumber?: () => number };
    createdAt: Date;
    updatedAt: Date;
    externalAgent?: { fullName: string } | null;
  }): RentalFinancialConfig {
    const n = (v: number | { toNumber?: () => number }) =>
      typeof v === 'number' ? v : v.toNumber?.() ?? Number(v);
    return new RentalFinancialConfig(
      row.id,
      row.rentalId,
      row.currency,
      row.baseAmount != null ? Number(row.baseAmount) : null,
      row.expenseType as FinancialValueType,
      n(row.expenseValue),
      row.taxType as FinancialValueType,
      n(row.taxValue),
      row.externalAgentId ?? null,
      row.externalAgentType as FinancialValueType,
      n(row.externalAgentValue),
      row.externalAgent?.fullName ?? row.externalAgentName,
      row.internalAgentId,
      row.internalAgentType as FinancialValueType,
      n(row.internalAgentValue),
      row.createdAt,
      row.updatedAt,
    );
  }
}
