import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RentalFinancialConfigPrismaMapper } from '../mappers/rental-financial-config-prisma.mapper';
import type {
  RentalFinancialConfigRepository,
  CreateOrUpdateRentalFinancialConfigData,
} from '@domain/repositories/rental-financial-config.repository';
import { RentalFinancialBreakdown } from '@domain/entities/rental-financial-config.entity';
import type { RentalFinancialConfig } from '@domain/entities/rental-financial-config.entity';

function computeAmount(type: string, value: number, base: number): number {
  if (type === 'PERCENT') return Math.round((base * value) / 100 * 100) / 100;
  return Math.round(value * 100) / 100;
}

@Injectable()
export class RentalFinancialConfigPrismaRepository implements RentalFinancialConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRentalId(rentalId: string): Promise<RentalFinancialConfig | null> {
    const row = await this.prisma.rentalFinancialConfig.findUnique({
      where: { rentalId },
      include: { externalAgent: { select: { fullName: true } } },
    });
    return row ? RentalFinancialConfigPrismaMapper.toDomain(row) : null;
  }

  async upsert(data: CreateOrUpdateRentalFinancialConfigData): Promise<RentalFinancialConfig> {
    const row = await this.prisma.rentalFinancialConfig.upsert({
      where: { rentalId: data.rentalId },
      create: {
        rentalId: data.rentalId,
        currency: data.currency ?? 'PEN',
        baseAmount: data.baseAmount ?? null,
        expenseType: data.expenseType ?? 'FIXED',
        expenseValue: data.expenseValue ?? 0,
        taxType: data.taxType ?? 'FIXED',
        taxValue: data.taxValue ?? 0,
        externalAgentId: data.externalAgentId ?? null,
        externalAgentType: data.externalAgentType ?? 'FIXED',
        externalAgentValue: data.externalAgentValue ?? 0,
        externalAgentName: data.externalAgentName ?? null,
        internalAgentId: data.internalAgentId ?? null,
        internalAgentType: data.internalAgentType ?? 'FIXED',
        internalAgentValue: data.internalAgentValue ?? 0,
      },
      update: {
        ...(data.currency != null && { currency: data.currency }),
        ...(data.baseAmount !== undefined && { baseAmount: data.baseAmount }),
        ...(data.expenseType != null && { expenseType: data.expenseType }),
        ...(data.expenseValue != null && { expenseValue: data.expenseValue }),
        ...(data.taxType != null && { taxType: data.taxType }),
        ...(data.taxValue != null && { taxValue: data.taxValue }),
        ...(data.externalAgentId !== undefined && { externalAgentId: data.externalAgentId }),
        ...(data.externalAgentType != null && { externalAgentType: data.externalAgentType }),
        ...(data.externalAgentValue != null && { externalAgentValue: data.externalAgentValue }),
        ...(data.externalAgentName !== undefined && { externalAgentName: data.externalAgentName }),
        ...(data.internalAgentId !== undefined && { internalAgentId: data.internalAgentId }),
        ...(data.internalAgentType != null && { internalAgentType: data.internalAgentType }),
        ...(data.internalAgentValue != null && { internalAgentValue: data.internalAgentValue }),
      },
      include: { externalAgent: { select: { fullName: true } } },
    });
    return RentalFinancialConfigPrismaMapper.toDomain(row);
  }

  async getBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown> {
    const config = await this.findByRentalId(rentalId);
    // Si hay un monto ingresado configurado, se usa como base; de lo contrario el monthlyAmount del contrato
    const base = (config?.baseAmount != null && config.baseAmount > 0)
      ? config.baseAmount
      : monthlyAmount;

    const expense = config
      ? computeAmount(config.expenseType, config.expenseValue, base)
      : 0;
    const tax = config ? computeAmount(config.taxType, config.taxValue, base) : 0;
    const externalAgentCommission = config
      ? computeAmount(config.externalAgentType, config.externalAgentValue, base)
      : 0;
    const internalAgentCommission = config
      ? computeAmount(config.internalAgentType, config.internalAgentValue, base)
      : 0;

    const totalDeductions = expense + tax + externalAgentCommission + internalAgentCommission;
    const utility = Math.round((base - totalDeductions) * 100) / 100;

    return new RentalFinancialBreakdown(
      monthlyAmount,
      base,
      currency,
      expense,
      tax,
      externalAgentCommission,
      internalAgentCommission,
      utility,
      config,
    );
  }

}
