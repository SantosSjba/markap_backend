import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  RentalFinancialConfigRepository,
  RentalFinancialConfigData,
  CreateOrUpdateRentalFinancialConfigData,
  RentalFinancialBreakdown,
  FinancialValueType,
} from '../../../../application/repositories/rental-financial-config.repository';

function computeAmount(type: string, value: number, base: number): number {
  if (type === 'PERCENT') return Math.round((base * value) / 100 * 100) / 100;
  return Math.round(value * 100) / 100;
}

@Injectable()
export class RentalFinancialConfigPrismaRepository implements RentalFinancialConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRentalId(rentalId: string): Promise<RentalFinancialConfigData | null> {
    const row = await this.prisma.rentalFinancialConfig.findUnique({
      where: { rentalId },
      include: { externalAgent: { select: { fullName: true } } },
    });
    return row ? this.toData(row) : null;
  }

  async upsert(data: CreateOrUpdateRentalFinancialConfigData): Promise<RentalFinancialConfigData> {
    const row = await this.prisma.rentalFinancialConfig.upsert({
      where: { rentalId: data.rentalId },
      create: {
        rentalId: data.rentalId,
        currency: data.currency ?? 'PEN',
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
    return this.toData(row);
  }

  async getBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown> {
    const config = await this.findByRentalId(rentalId);
    const base = monthlyAmount;

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

    return {
      monthlyAmount: base,
      currency,
      expense,
      tax,
      externalAgentCommission,
      internalAgentCommission,
      utility,
      config,
    };
  }

  private toData(row: {
    id: string;
    rentalId: string;
    currency: string;
    expenseType: string;
    expenseValue: number;
    taxType: string;
    taxValue: number;
    externalAgentId: string | null;
    externalAgentType: string;
    externalAgentValue: number;
    externalAgentName: string | null;
    internalAgentId: string | null;
    internalAgentType: string;
    internalAgentValue: number;
    createdAt: Date;
    updatedAt: Date;
    externalAgent?: { fullName: string } | null;
  }): RentalFinancialConfigData {
    return {
      id: row.id,
      rentalId: row.rentalId,
      currency: row.currency,
      expenseType: row.expenseType as FinancialValueType,
      expenseValue: Number(row.expenseValue),
      taxType: row.taxType as FinancialValueType,
      taxValue: Number(row.taxValue),
      externalAgentId: row.externalAgentId ?? null,
      externalAgentType: row.externalAgentType as FinancialValueType,
      externalAgentValue: Number(row.externalAgentValue),
      externalAgentName: row.externalAgent?.fullName ?? row.externalAgentName,
      internalAgentId: row.internalAgentId,
      internalAgentType: row.internalAgentType as FinancialValueType,
      internalAgentValue: Number(row.internalAgentValue),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
