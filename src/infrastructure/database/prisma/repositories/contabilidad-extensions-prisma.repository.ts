import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_FINANCIAL_REPOSITORY } from '@common/constants/injection-tokens';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_ACCOUNT_TYPES } from '@domain/constants/contabilidad-pcge.defaults';
import { accountBalanceFromTotals } from '@domain/constants/contabilidad-financial.defaults';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import type {
  ApplyJournalTemplateResultDto,
  ContabilidadElectronicDocumentLogDto,
  ContabilidadExchangeRateDto,
  ContabilidadExtensionsRepository,
  ContabilidadInventorySnapshotDto,
  ContabilidadJournalTemplateDto,
  CreateElectronicDocumentLogInput,
  CreateJournalTemplateInput,
  IncomeTaxSummaryDto,
  ListElectronicDocumentLogsFilters,
  ListExchangeRatesFilters,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
} from '@domain/repositories/contabilidad-extensions.repository';
import { formatPenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { PrismaService } from '../prisma.service';

const templateInclude = {
  lines: {
    orderBy: { lineNumber: 'asc' as const },
    include: {
      account: { select: { code: true, name: true } },
      costCenter: { select: { code: true } },
    },
  },
};

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mapTemplate(row: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lines: {
    id: string;
    lineNumber: number;
    accountId: string;
    defaultDebit: { toString(): string } | number;
    defaultCredit: { toString(): string } | number;
    costCenterId: string | null;
    description: string | null;
    account: { code: string; name: string };
    costCenter?: { code: string } | null;
  }[];
}): ContabilidadJournalTemplateDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lines: row.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      accountId: line.accountId,
      accountCode: line.account.code,
      accountName: line.account.name,
      defaultDebit: formatPenAmount(Number(line.defaultDebit)),
      defaultCredit: formatPenAmount(Number(line.defaultCredit)),
      costCenterId: line.costCenterId,
      costCenterCode: line.costCenter?.code ?? null,
      description: line.description,
    })),
  };
}

@Injectable()
export class ContabilidadExtensionsPrismaRepository implements ContabilidadExtensionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTABILIDAD_FINANCIAL_REPOSITORY)
    private readonly financial: ContabilidadFinancialRepository,
  ) {}

  async listExchangeRates(
    applicationId: string,
    filters: ListExchangeRatesFilters,
  ): Promise<ContabilidadExchangeRateDto[]> {
    const rows = await this.prisma.contabilidadExchangeRate.findMany({
      where: {
        applicationId,
        ...(filters.currencyCode ? { currencyCode: filters.currencyCode.trim().toUpperCase() } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              rateDate: {
                ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T12:00:00.000Z`) } : {}),
                ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T12:00:00.000Z`) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ rateDate: 'desc' }, { currencyCode: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      rateDate: toIsoDate(row.rateDate),
      currencyCode: row.currencyCode,
      buyRate: Number(row.buyRate).toFixed(6),
      sellRate: Number(row.sellRate).toFixed(6),
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsertExchangeRate(
    applicationId: string,
    input: UpsertExchangeRateInput,
  ): Promise<ContabilidadExchangeRateDto> {
    const rateDate = new Date(`${input.rateDate}T12:00:00.000Z`);
    const currencyCode = input.currencyCode.trim().toUpperCase();
    const buyRate = roundPenAmount(Number(input.buyRate));
    const sellRate = roundPenAmount(Number(input.sellRate));

    const row = await this.prisma.contabilidadExchangeRate.upsert({
      where: {
        applicationId_rateDate_currencyCode: {
          applicationId,
          rateDate,
          currencyCode,
        },
      },
      create: {
        applicationId,
        rateDate,
        currencyCode,
        buyRate,
        sellRate,
        source: input.source?.trim() || 'MANUAL',
      },
      update: {
        buyRate,
        sellRate,
        source: input.source?.trim() || 'MANUAL',
      },
    });

    return {
      id: row.id,
      rateDate: toIsoDate(row.rateDate),
      currencyCode: row.currencyCode,
      buyRate: Number(row.buyRate).toFixed(6),
      sellRate: Number(row.sellRate).toFixed(6),
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listJournalTemplates(applicationId: string): Promise<ContabilidadJournalTemplateDto[]> {
    const rows = await this.prisma.contabilidadJournalTemplate.findMany({
      where: { applicationId },
      include: templateInclude,
      orderBy: [{ name: 'asc' }],
    });
    return rows.map(mapTemplate);
  }

  async findJournalTemplateById(
    applicationId: string,
    id: string,
  ): Promise<ContabilidadJournalTemplateDto | null> {
    const row = await this.prisma.contabilidadJournalTemplate.findFirst({
      where: { applicationId, id },
      include: templateInclude,
    });
    return row ? mapTemplate(row) : null;
  }

  async createJournalTemplate(
    applicationId: string,
    input: CreateJournalTemplateInput,
  ): Promise<ContabilidadJournalTemplateDto> {
    const row = await this.prisma.contabilidadJournalTemplate.create({
      data: {
        applicationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        lines: {
          create: input.lines.map((line) => ({
            lineNumber: line.lineNumber,
            accountId: line.accountId,
            defaultDebit: roundPenAmount(Number(line.defaultDebit ?? 0)),
            defaultCredit: roundPenAmount(Number(line.defaultCredit ?? 0)),
            costCenterId: line.costCenterId ?? null,
            description: line.description?.trim() || null,
          })),
        },
      },
      include: templateInclude,
    });
    return mapTemplate(row);
  }

  async updateJournalTemplate(
    applicationId: string,
    id: string,
    input: UpdateJournalTemplateInput,
  ): Promise<ContabilidadJournalTemplateDto> {
    const existing = await this.prisma.contabilidadJournalTemplate.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Plantilla no encontrada');

    if (input.lines) {
      await this.prisma.contabilidadJournalTemplateLine.deleteMany({ where: { templateId: id } });
    }

    const row = await this.prisma.contabilidadJournalTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.lines
          ? {
              lines: {
                create: input.lines.map((line) => ({
                  lineNumber: line.lineNumber,
                  accountId: line.accountId,
                  defaultDebit: roundPenAmount(Number(line.defaultDebit ?? 0)),
                  defaultCredit: roundPenAmount(Number(line.defaultCredit ?? 0)),
                  costCenterId: line.costCenterId ?? null,
                  description: line.description?.trim() || null,
                })),
              },
            }
          : {}),
      },
      include: templateInclude,
    });
    return mapTemplate(row);
  }

  async deleteJournalTemplate(applicationId: string, id: string): Promise<void> {
    const existing = await this.prisma.contabilidadJournalTemplate.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Plantilla no encontrada');
    await this.prisma.contabilidadJournalTemplate.delete({ where: { id } });
  }

  async applyJournalTemplate(
    applicationId: string,
    templateId: string,
  ): Promise<ApplyJournalTemplateResultDto> {
    const template = await this.findJournalTemplateById(applicationId, templateId);
    if (!template?.isActive) throw new Error('Plantilla no encontrada o inactiva');

    return {
      templateId: template.id,
      templateName: template.name,
      description: template.description ?? template.name,
      lines: template.lines.map((line) => ({
        lineNumber: line.lineNumber,
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.defaultDebit,
        credit: line.defaultCredit,
        costCenterId: line.costCenterId,
        description: line.description,
      })),
    };
  }

  async generateInventorySnapshot(
    applicationId: string,
    periodId: string,
  ): Promise<ContabilidadInventorySnapshotDto[]> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
    });
    if (!period) throw new Error('Periodo no encontrado');

    const periodIds = await this.prisma.contabilidadPeriod.findMany({
      where: {
        applicationId,
        OR: [{ year: { lt: period.year } }, { year: period.year, month: { lte: period.month } }],
      },
      select: { id: true },
    });

    const grouped = await this.prisma.contabilidadJournalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          applicationId,
          periodId: { in: periodIds.map((p) => p.id) },
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
      },
      _sum: { debit: true, credit: true },
    });

    const accountIds = grouped.map((g) => g.accountId);
    const accounts = accountIds.length
      ? await this.prisma.contabilidadAccount.findMany({
          where: {
            applicationId,
            id: { in: accountIds },
            accountType: {
              in: [
                CONTABILIDAD_ACCOUNT_TYPES.ASSET,
                CONTABILIDAD_ACCOUNT_TYPES.LIABILITY,
                CONTABILIDAD_ACCOUNT_TYPES.EQUITY,
              ],
            },
            isMovement: true,
          },
        })
      : [];
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    await this.prisma.contabilidadInventoryBalanceSnapshot.deleteMany({
      where: { applicationId, periodId },
    });

    const created: ContabilidadInventorySnapshotDto[] = [];
    for (const g of grouped) {
      const acc = accountMap.get(g.accountId);
      if (!acc) continue;
      const balance = accountBalanceFromTotals(
        acc.accountType,
        Number(g._sum.debit ?? 0),
        Number(g._sum.credit ?? 0),
      );
      if (Math.abs(balance) < 0.005) continue;

      const row = await this.prisma.contabilidadInventoryBalanceSnapshot.create({
        data: {
          applicationId,
          periodId,
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          balance: roundPenAmount(balance),
        },
      });
      created.push({
        id: row.id,
        periodId: row.periodId,
        accountId: row.accountId,
        accountCode: row.accountCode,
        accountName: row.accountName,
        balance: formatPenAmount(Number(row.balance)),
        createdAt: row.createdAt.toISOString(),
      });
    }

    created.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    return created;
  }

  async listInventorySnapshots(
    applicationId: string,
    periodId: string,
  ): Promise<ContabilidadInventorySnapshotDto[]> {
    const rows = await this.prisma.contabilidadInventoryBalanceSnapshot.findMany({
      where: { applicationId, periodId },
      orderBy: [{ accountCode: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      periodId: row.periodId,
      accountId: row.accountId,
      accountCode: row.accountCode,
      accountName: row.accountName,
      balance: formatPenAmount(Number(row.balance)),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listElectronicDocumentLogs(
    applicationId: string,
    filters: ListElectronicDocumentLogsFilters,
  ): Promise<ContabilidadElectronicDocumentLogDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadElectronicDocumentLog.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.documentKind ? { documentKind: filters.documentKind } : {}),
        ...(q
          ? {
              OR: [
                { documentRef: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      periodId: row.periodId,
      documentKind: row.documentKind,
      documentRef: row.documentRef,
      sunatStatus: row.sunatStatus,
      xmlHash: row.xmlHash,
      cdrReference: row.cdrReference,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createElectronicDocumentLog(
    applicationId: string,
    input: CreateElectronicDocumentLogInput,
  ): Promise<ContabilidadElectronicDocumentLogDto> {
    const row = await this.prisma.contabilidadElectronicDocumentLog.create({
      data: {
        applicationId,
        periodId: input.periodId ?? null,
        documentKind: input.documentKind.trim(),
        documentRef: input.documentRef.trim(),
        sunatStatus: input.sunatStatus?.trim() || 'REGISTERED',
        xmlHash: input.xmlHash?.trim() || null,
        cdrReference: input.cdrReference?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    return {
      id: row.id,
      periodId: row.periodId,
      documentKind: row.documentKind,
      documentRef: row.documentRef,
      sunatStatus: row.sunatStatus,
      xmlHash: row.xmlHash,
      cdrReference: row.cdrReference,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getIncomeTaxSummary(applicationId: string, periodId: string): Promise<IncomeTaxSummaryDto> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
    });
    if (!period) throw new Error('Periodo no encontrado');

    const incomeStmt = await this.financial.getIncomeStatement(applicationId, periodId);
    const totalIncome = Number(incomeStmt.income.total);
    const totalExpenses = Number(incomeStmt.expenses.total);
    const netIncome = Number(incomeStmt.netIncome);

    const periodIds = await this.prisma.contabilidadPeriod.findMany({
      where: {
        applicationId,
        OR: [{ year: { lt: period.year } }, { year: period.year, month: { lte: period.month } }],
      },
      select: { id: true },
    });

    const rentaAgg = await this.prisma.contabilidadJournalEntryLine.aggregate({
      where: {
        journalEntry: {
          applicationId,
          periodId: { in: periodIds.map((p) => p.id) },
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
        account: { code: '4012' },
      },
      _sum: { debit: true, credit: true },
    });

    const rentaBalance = accountBalanceFromTotals(
      CONTABILIDAD_ACCOUNT_TYPES.LIABILITY,
      Number(rentaAgg._sum.debit ?? 0),
      Number(rentaAgg._sum.credit ?? 0),
    );

    const estimatedTax = roundPenAmount(Math.max(0, netIncome * 0.295));

    return {
      periodId,
      year: period.year,
      month: period.month,
      totalIncome: formatPenAmount(totalIncome),
      totalExpenses: formatPenAmount(totalExpenses),
      netIncomeBeforeTax: formatPenAmount(netIncome),
      rentaAccountBalance: formatPenAmount(rentaBalance),
      estimatedTaxProvision: formatPenAmount(estimatedTax),
    };
  }
}
