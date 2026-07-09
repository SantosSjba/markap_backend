import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RentalFinancialConfigPrismaMapper } from '../mappers/rental-financial-config-prisma.mapper';
import type {
  RentalFinancialConfigRepository,
  CreateOrUpdateRentalFinancialConfigData,
} from '@domain/repositories/rental-financial-config.repository';
import { RentalFinancialBreakdown } from '@domain/entities/rental-financial-config.entity';
import type { RentalFinancialConfig } from '@domain/entities/rental-financial-config.entity';
import { computeRentalFinancialBreakdown } from '@domain/utils/rental-financial-breakdown.util';

@Injectable()
export class RentalFinancialConfigPrismaRepository implements RentalFinancialConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRentalId(rentalId: string): Promise<RentalFinancialConfig | null> {
    const row = await this.prisma.rentalFinancialConfig.findUnique({
      where: { rentalId },
      include: {
        externalAgent: { select: { fullName: true } },
        internalAgent: { select: { fullName: true } },
      },
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
        expenseDetail: data.expenseDetail ?? null,
        taxType: data.taxType ?? 'FIXED',
        taxValue: data.taxValue ?? 0,
        taxDetail: data.taxDetail ?? null,
        externalAgentId: data.externalAgentId ?? null,
        externalAgentType: data.externalAgentType ?? 'FIXED',
        externalAgentValue: data.externalAgentValue ?? 0,
        externalAgentName: data.externalAgentName ?? null,
        internalAgentId: data.internalAgentId ?? null,
        internalAgentType: data.internalAgentType ?? 'FIXED',
        internalAgentValue: data.internalAgentValue ?? 0,
        internalAgentName: data.internalAgentName ?? null,
      },
      update: {
        ...(data.currency != null && { currency: data.currency }),
        ...(data.baseAmount !== undefined && { baseAmount: data.baseAmount }),
        ...(data.expenseType != null && { expenseType: data.expenseType }),
        ...(data.expenseValue != null && { expenseValue: data.expenseValue }),
        ...(data.expenseDetail !== undefined && { expenseDetail: data.expenseDetail }),
        ...(data.taxType != null && { taxType: data.taxType }),
        ...(data.taxValue != null && { taxValue: data.taxValue }),
        ...(data.taxDetail !== undefined && { taxDetail: data.taxDetail }),
        ...(data.externalAgentId !== undefined && { externalAgentId: data.externalAgentId }),
        ...(data.externalAgentType != null && { externalAgentType: data.externalAgentType }),
        ...(data.externalAgentValue != null && { externalAgentValue: data.externalAgentValue }),
        ...(data.externalAgentName !== undefined && { externalAgentName: data.externalAgentName }),
        ...(data.internalAgentId !== undefined && { internalAgentId: data.internalAgentId }),
        ...(data.internalAgentType != null && { internalAgentType: data.internalAgentType }),
        ...(data.internalAgentValue != null && { internalAgentValue: data.internalAgentValue }),
        ...(data.internalAgentName !== undefined && { internalAgentName: data.internalAgentName }),
      },
      include: {
        externalAgent: { select: { fullName: true } },
        internalAgent: { select: { fullName: true } },
      },
    });
    return RentalFinancialConfigPrismaMapper.toDomain(row);
  }

  async getBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown> {
    const config = await this.findByRentalId(rentalId);
    const breakdown = computeRentalFinancialBreakdown(monthlyAmount, config ?? undefined);

    return new RentalFinancialBreakdown(
      monthlyAmount,
      breakdown.base,
      currency,
      breakdown.expense,
      breakdown.tax,
      breakdown.externalAgentCommission,
      breakdown.internalAgentCommission,
      breakdown.utility,
      config,
    );
  }

}
