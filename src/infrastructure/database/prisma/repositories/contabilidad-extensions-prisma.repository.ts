import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_FINANCIAL_REPOSITORY } from '@common/constants/injection-tokens';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_RETENTION_TYPE } from '@domain/constants/contabilidad-taxes.defaults';
import {
  CONTABILIDAD_DEFAULT_INCOME_TAX_RATE_PERCENT,
  CONTABILIDAD_RENTA_ACCOUNT_CODE,
} from '@domain/constants/contabilidad-taxes.defaults';
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
  IncomeTaxDetailDto,
  IncomeTaxExportDto,
  IncomeTaxSummaryDto,
  ListElectronicDocumentLogsFilters,
  ListExchangeRatesFilters,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
  UpsertIncomeTaxPeriodInput,
} from '@domain/repositories/contabilidad-extensions.repository';
import {
  computeEstimatedIncomeTax,
  computeNetTaxBalance,
  computeTaxableBase,
} from '@domain/utils/contabilidad-income-tax.util';
import { formatPenAmount, parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { formatDateOnly, parseDateOnly, toIsoDate } from '@domain/utils/peru-date.util';
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
                ...(filters.dateFrom ? { gte: parseDateOnly(filters.dateFrom) } : {}),
                ...(filters.dateTo ? { lte: parseDateOnly(filters.dateTo) } : {}),
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
    const rateDate = parseDateOnly(input.rateDate);
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
    const detail = await this.getIncomeTaxDetail(applicationId, periodId);
    return {
      periodId: detail.periodId,
      year: detail.year,
      month: detail.month,
      totalIncome: detail.totalIncome,
      totalExpenses: detail.totalExpenses,
      netIncomeBeforeTax: detail.netIncomeBeforeTax,
      rentaAccountBalance: detail.rentaAccountBalance,
      estimatedTaxProvision: detail.estimatedTaxProvision,
    };
  }

  async getIncomeTaxDetail(applicationId: string, periodId: string): Promise<IncomeTaxDetailDto> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
    });
    if (!period) throw new Error('Periodo no encontrado');

    const company = await this.prisma.contabilidadCompanyProfile.findFirst({
      where: { applicationId },
    });

    const stored = await this.prisma.contabilidadIncomeTaxPeriodSummary.findUnique({
      where: { applicationId_periodId: { applicationId, periodId } },
    });

    const adjustments = this.mapStoredAdjustments(stored);
    const incomeStmt = await this.financial.getIncomeStatement(applicationId, periodId);
    const totalIncome = Number(incomeStmt.income.total);
    const totalExpenses = Number(incomeStmt.expenses.total);
    const netIncome = Number(incomeStmt.netIncome);
    const taxableBase = computeTaxableBase(netIncome, adjustments);
    const estimatedTax = computeEstimatedIncomeTax(taxableBase);
    const rentaAccountBalance = await this.getRentaAccountBalance(applicationId, period);

    const yearPeriods = await this.prisma.contabilidadPeriod.findMany({
      where: { applicationId, year: period.year, month: { lte: period.month } },
      orderBy: { month: 'asc' },
    });
    const yearPeriodIds = yearPeriods.map((p) => p.id);

    const storedByPeriod = await this.prisma.contabilidadIncomeTaxPeriodSummary.findMany({
      where: { applicationId, periodId: { in: yearPeriodIds } },
    });
    const storedMap = new Map(storedByPeriod.map((row) => [row.periodId, row]));

    let ytdNetIncome = 0;
    let ytdTaxableBase = 0;
    let accumulatedNet = 0;
    const monthlyTrend: IncomeTaxDetailDto['monthlyTrend'] = [];

    for (const p of yearPeriods) {
      const er = await this.financial.getIncomeStatement(applicationId, p.id);
      const pNet = Number(er.netIncome);
      const pAdj = this.mapStoredAdjustments(storedMap.get(p.id) ?? null);
      const pTaxable = computeTaxableBase(pNet, pAdj);
      const pTax = computeEstimatedIncomeTax(pTaxable);
      ytdNetIncome += pNet;
      ytdTaxableBase += pTaxable;
      accumulatedNet += pNet;
      monthlyTrend.push({
        periodId: p.id,
        year: p.year,
        month: p.month,
        label: `${p.year}-${String(p.month).padStart(2, '0')}`,
        netIncome: formatPenAmount(pNet),
        estimatedTax: formatPenAmount(pTax),
        accumulatedNetIncome: formatPenAmount(accumulatedNet),
      });
    }

    const ytdEstimatedTax = computeEstimatedIncomeTax(ytdTaxableBase);

    const retentionsPeriodRows = await this.prisma.contabilidadRetention.findMany({
      where: {
        applicationId,
        periodId,
        retentionType: CONTABILIDAD_RETENTION_TYPE.RENTA,
        status: 'ACTIVE',
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });

    const retentionsYtdAgg = await this.prisma.contabilidadRetention.aggregate({
      where: {
        applicationId,
        periodId: { in: yearPeriodIds },
        retentionType: CONTABILIDAD_RETENTION_TYPE.RENTA,
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });

    const advancesYtdAgg = await this.prisma.contabilidadIncomeTaxPeriodSummary.aggregate({
      where: { applicationId, periodId: { in: yearPeriodIds } },
      _sum: { advancePaymentAmount: true },
    });

    const retentionsPeriodTotal = retentionsPeriodRows.reduce((sum, row) => sum + Number(row.amount), 0);
    const retentionsYtdTotal = Number(retentionsYtdAgg._sum.amount ?? 0);
    const advancePaymentsYtd = Number(advancesYtdAgg._sum.advancePaymentAmount ?? 0);
    const netTaxBalanceYtd = computeNetTaxBalance(ytdEstimatedTax, retentionsYtdTotal, advancePaymentsYtd);

    return {
      periodId,
      year: period.year,
      month: period.month,
      ruc: company?.ruc ?? '',
      legalName: company?.legalName ?? '',
      incomeTaxRatePercent: CONTABILIDAD_DEFAULT_INCOME_TAX_RATE_PERCENT.toFixed(2),
      totalIncome: formatPenAmount(totalIncome),
      totalExpenses: formatPenAmount(totalExpenses),
      netIncomeBeforeTax: formatPenAmount(netIncome),
      taxableBase: formatPenAmount(taxableBase),
      estimatedTaxProvision: formatPenAmount(estimatedTax),
      ytdNetIncome: formatPenAmount(ytdNetIncome),
      ytdTaxableBase: formatPenAmount(ytdTaxableBase),
      ytdEstimatedTax: formatPenAmount(ytdEstimatedTax),
      rentaAccountBalance: formatPenAmount(rentaAccountBalance),
      adjustments: {
        deductibleAdjustments: formatPenAmount(adjustments.deductibleAdjustments),
        nonDeductibleAdjustments: formatPenAmount(adjustments.nonDeductibleAdjustments),
        otherIncomeAdjustments: formatPenAmount(adjustments.otherIncomeAdjustments),
        otherExpenseAdjustments: formatPenAmount(adjustments.otherExpenseAdjustments),
        advancePaymentAmount: formatPenAmount(Number(stored?.advancePaymentAmount ?? 0)),
        notes: stored?.notes ?? null,
      },
      retentionsPeriod: retentionsPeriodRows.map((row) => ({
        id: row.id,
        issueDate: formatDateOnly(row.issueDate),
        counterpartyRuc: row.counterpartyRuc,
        counterpartyName: row.counterpartyName,
        documentRef:
          row.documentSeries && row.documentNumber
            ? `${row.documentSeries}-${row.documentNumber}`
            : null,
        taxableBase: formatPenAmount(Number(row.taxableBase)),
        ratePercent: Number(row.ratePercent).toFixed(2),
        amount: formatPenAmount(Number(row.amount)),
      })),
      retentionsPeriodTotal: formatPenAmount(retentionsPeriodTotal),
      retentionsYtdTotal: formatPenAmount(retentionsYtdTotal),
      advancePaymentsYtd: formatPenAmount(advancePaymentsYtd),
      netTaxBalanceYtd: formatPenAmount(netTaxBalanceYtd),
      monthlyTrend,
    };
  }

  async upsertIncomeTaxPeriodSummary(
    applicationId: string,
    periodId: string,
    input: UpsertIncomeTaxPeriodInput,
  ): Promise<IncomeTaxDetailDto> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
    });
    if (!period) throw new Error('Periodo no encontrado');

    await this.prisma.contabilidadIncomeTaxPeriodSummary.upsert({
      where: { applicationId_periodId: { applicationId, periodId } },
      create: {
        applicationId,
        periodId,
        deductibleAdjustments: parsePenAmount(input.deductibleAdjustments ?? 0),
        nonDeductibleAdjustments: parsePenAmount(input.nonDeductibleAdjustments ?? 0),
        otherIncomeAdjustments: parsePenAmount(input.otherIncomeAdjustments ?? 0),
        otherExpenseAdjustments: parsePenAmount(input.otherExpenseAdjustments ?? 0),
        advancePaymentAmount: parsePenAmount(input.advancePaymentAmount ?? 0),
        notes: input.notes?.trim() || null,
      },
      update: {
        deductibleAdjustments: parsePenAmount(input.deductibleAdjustments ?? 0),
        nonDeductibleAdjustments: parsePenAmount(input.nonDeductibleAdjustments ?? 0),
        otherIncomeAdjustments: parsePenAmount(input.otherIncomeAdjustments ?? 0),
        otherExpenseAdjustments: parsePenAmount(input.otherExpenseAdjustments ?? 0),
        advancePaymentAmount: parsePenAmount(input.advancePaymentAmount ?? 0),
        notes: input.notes?.trim() || null,
      },
    });

    return this.getIncomeTaxDetail(applicationId, periodId);
  }

  async exportIncomeTaxDraft(applicationId: string, periodId: string): Promise<IncomeTaxExportDto> {
    const detail = await this.getIncomeTaxDetail(applicationId, periodId);
    return {
      periodId: detail.periodId,
      year: detail.year,
      month: detail.month,
      ruc: detail.ruc,
      legalName: detail.legalName,
      generatedAt: new Date().toISOString(),
      detail,
    };
  }

  private mapStoredAdjustments(
    stored: {
      deductibleAdjustments: { toString(): string } | number;
      nonDeductibleAdjustments: { toString(): string } | number;
      otherIncomeAdjustments: { toString(): string } | number;
      otherExpenseAdjustments: { toString(): string } | number;
    } | null,
  ) {
    return {
      deductibleAdjustments: stored ? Number(stored.deductibleAdjustments) : 0,
      nonDeductibleAdjustments: stored ? Number(stored.nonDeductibleAdjustments) : 0,
      otherIncomeAdjustments: stored ? Number(stored.otherIncomeAdjustments) : 0,
      otherExpenseAdjustments: stored ? Number(stored.otherExpenseAdjustments) : 0,
    };
  }

  private async getRentaAccountBalance(
    applicationId: string,
    period: { year: number; month: number },
  ): Promise<number> {
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
        account: { code: CONTABILIDAD_RENTA_ACCOUNT_CODE },
      },
      _sum: { debit: true, credit: true },
    });

    return accountBalanceFromTotals(
      CONTABILIDAD_ACCOUNT_TYPES.LIABILITY,
      Number(rentaAgg._sum.debit ?? 0),
      Number(rentaAgg._sum.credit ?? 0),
    );
  }
}
