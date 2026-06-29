import { Injectable } from '@nestjs/common';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { accountBalanceFromTotals } from '@domain/constants/contabilidad-financial.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE_LABELS } from '@domain/constants/contabilidad-treasury.defaults';
import { CONTABILIDAD_TREASURY_SOURCE_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import type { ContabilidadTaxesRepository } from '@domain/repositories/contabilidad-taxes.repository';
import { PrismaService } from '../prisma.service';
import type {
  CashFlowTreasuryDto,
  ContabilidadDashboardActivityDto,
  ContabilidadDashboardDto,
  ContabilidadReportsRepository,
  FinancialAnalysisDto,
  TrialBalanceDto,
} from '@domain/repositories/contabilidad-reports.repository';
import { formatPenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';

export class ContabilidadReportsPrismaRepository implements ContabilidadReportsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: ContabilidadFinancialRepository,
    private readonly taxes: ContabilidadTaxesRepository,
  ) {}

  async getDashboard(
    applicationId: string,
    periodId: string,
    igvPercent: number,
  ): Promise<ContabilidadDashboardDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const [incomeStmt, balanceSheet, igv, entryCounts, treasury] = await Promise.all([
      this.financial.getIncomeStatement(applicationId, periodId),
      this.financial.getBalanceSheet(applicationId, periodId),
      this.taxes.getIgvSummary(applicationId, periodId, igvPercent),
      this.entryCounts(applicationId, periodId),
      this.treasuryNet(applicationId, periodId),
    ]);

    const balances = await this.aggregatePeriodBalances(applicationId, periodId);
    const cxc = this.sumByCodePrefix(balances, '104');
    const cxp = this.sumByCodePrefix(balances, '42');
    const liquidityAssets = this.sumByCodePrefix(balances, '10');
    const liquidityLiab = this.sumByCodePrefix(balances, '42');
    const liquidity =
      liquidityLiab > 0 ? roundPenAmount(liquidityAssets / liquidityLiab) : liquidityAssets > 0 ? 99 : 0;

    const kpis = [
      {
        key: 'posted_entries',
        label: 'Asientos publicados',
        value: String(entryCounts.posted),
        format: 'number' as const,
        hint: entryCounts.draft > 0 ? `${entryCounts.draft} en borrador` : null,
      },
      {
        key: 'net_income',
        label: 'Resultado del periodo',
        value: incomeStmt.netIncome,
        format: 'money' as const,
      },
      {
        key: 'liquidity',
        label: 'Liquidez corriente',
        value: liquidity >= 99 ? '—' : formatPenAmount(liquidity),
        format: 'text' as const,
        hint: 'Activo corriente (10) / Pasivo corriente (42)',
      },
      {
        key: 'cxc',
        label: 'Cuentas por cobrar',
        value: formatPenAmount(cxc),
        format: 'money' as const,
      },
      {
        key: 'cxp',
        label: 'Cuentas por pagar',
        value: formatPenAmount(cxp),
        format: 'money' as const,
      },
      {
        key: 'igv_balance',
        label: 'IGV por declarar',
        value:
          Number(igv.balanceToPay) > 0
            ? igv.balanceToPay
            : Number(igv.balanceInFavor) > 0
              ? `-${igv.balanceInFavor}`
              : '0.00',
        format: 'money' as const,
        hint: Number(igv.balanceInFavor) > 0 ? 'Saldo a favor' : 'Saldo a pagar',
      },
      {
        key: 'cash_bank',
        label: 'Caja y bancos (periodo)',
        value: formatPenAmount(treasury.net),
        format: 'money' as const,
        hint: `In ${formatPenAmount(treasury.in)} · Out ${formatPenAmount(treasury.out)}`,
      },
      {
        key: 'total_assets',
        label: 'Total activo',
        value: balanceSheet.assets.total,
        format: 'money' as const,
      },
    ];

    const recentActivity = await this.recentActivity(applicationId, periodId);

    return {
      periodId,
      year: period.year,
      month: period.month,
      kpis,
      recentActivity,
    };
  }

  async getTrialBalance(
    applicationId: string,
    periodId: string,
    costCenterId?: string | null,
  ): Promise<TrialBalanceDto> {
    const period = await this.requirePeriod(applicationId, periodId);

    const grouped = await this.prisma.contabilidadJournalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          applicationId,
          periodId,
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
        ...(costCenterId ? { costCenterId } : {}),
      },
      _sum: { debit: true, credit: true },
    });

    const accountIds = grouped.map((g) => g.accountId);
    const accounts = accountIds.length
      ? await this.prisma.contabilidadAccount.findMany({
          where: { applicationId, id: { in: accountIds } },
          select: { id: true, code: true, name: true, accountType: true },
        })
      : [];
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    let totalDebit = 0;
    let totalCredit = 0;
    const lines = grouped
      .map((g) => {
        const acc = accountMap.get(g.accountId);
        if (!acc) return null;
        const d = Number(g._sum.debit ?? 0);
        const c = Number(g._sum.credit ?? 0);
        totalDebit += d;
        totalCredit += c;
        const balance = accountBalanceFromTotals(acc.accountType, d, c);
        return {
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.accountType,
          totalDebit: formatPenAmount(d),
          totalCredit: formatPenAmount(c),
          balance: formatPenAmount(balance),
        };
      })
      .filter((l): l is NonNullable<typeof l> => l != null)
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    totalDebit = roundPenAmount(totalDebit);
    totalCredit = roundPenAmount(totalCredit);

    return {
      periodId,
      year: period.year,
      month: period.month,
      lines,
      totalDebit: formatPenAmount(totalDebit),
      totalCredit: formatPenAmount(totalCredit),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  async getFinancialAnalysis(applicationId: string, periodId: string): Promise<FinancialAnalysisDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const priorId = await this.financial.findPriorPeriodId(applicationId, period.year, period.month);

    const [bg, er, priorBg, priorEr] = await Promise.all([
      this.financial.getBalanceSheet(applicationId, periodId, priorId),
      this.financial.getIncomeStatement(applicationId, periodId, priorId),
      priorId ? this.financial.getBalanceSheet(applicationId, priorId, null) : null,
      priorId ? this.financial.getIncomeStatement(applicationId, priorId, null) : null,
    ]);

    const assets = Number(bg.assets.total);
    const liabilities = Number(bg.liabilities.total);
    const equity = Number(bg.equity.total);
    const income = Number(er.income.total);
    const netIncome = Number(er.netIncome);

    const priorAssets = priorBg ? Number(priorBg.assets.total) : null;
    const priorLiab = priorBg ? Number(priorBg.liabilities.total) : null;
    const priorEquity = priorBg ? Number(priorBg.equity.total) : null;
    const priorIncome = priorEr ? Number(priorEr.income.total) : null;
    const priorNet = priorEr?.priorNetIncome != null ? Number(priorEr.netIncome) : null;

    const ratio = (num: number, den: number) => (den > 0 ? roundPenAmount(num / den) : null);
    const pct = (num: number, den: number) => (den > 0 ? roundPenAmount((num / den) * 100) : null);

    const ratios = [
      {
        key: 'current_ratio',
        label: 'Liquidez corriente',
        value: ratio(assets, liabilities)?.toFixed(2) ?? null,
        priorValue:
          priorAssets != null && priorLiab != null
            ? ratio(priorAssets, priorLiab)?.toFixed(2) ?? null
            : null,
        unit: 'ratio' as const,
        description: 'Activo / Pasivo (aprox. acumulado)',
      },
      {
        key: 'debt_ratio',
        label: 'Endeudamiento',
        value: pct(liabilities, assets)?.toFixed(2) ?? null,
        priorValue:
          priorAssets != null && priorLiab != null
            ? pct(priorLiab, priorAssets)?.toFixed(2) ?? null
            : null,
        unit: 'percent' as const,
        description: 'Pasivo / Activo × 100',
      },
      {
        key: 'equity_ratio',
        label: 'Patrimonio / Activo',
        value: pct(equity, assets)?.toFixed(2) ?? null,
        priorValue:
          priorAssets != null && priorEquity != null
            ? pct(priorEquity, priorAssets)?.toFixed(2) ?? null
            : null,
        unit: 'percent' as const,
        description: 'Participación del patrimonio en el activo',
      },
      {
        key: 'profit_margin',
        label: 'Margen neto',
        value: pct(netIncome, income)?.toFixed(2) ?? null,
        priorValue:
          priorNet != null && priorIncome != null
            ? pct(priorNet, priorIncome)?.toFixed(2) ?? null
            : null,
        unit: 'percent' as const,
        description: 'Utilidad neta / Ingresos del periodo',
      },
      {
        key: 'roa',
        label: 'ROA (aprox.)',
        value: pct(netIncome, assets)?.toFixed(2) ?? null,
        priorValue:
          priorNet != null && priorAssets != null
            ? pct(priorNet, priorAssets)?.toFixed(2) ?? null
            : null,
        unit: 'percent' as const,
        description: 'Utilidad neta / Activo total',
      },
    ];

    return {
      periodId,
      priorPeriodId: priorId,
      year: period.year,
      month: period.month,
      ratios,
    };
  }

  async getCashFlowTreasury(applicationId: string, periodId: string): Promise<CashFlowTreasuryDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const movements = await this.prisma.contabilidadTreasuryMovement.findMany({
      where: { applicationId, periodId },
      select: { movementType: true, sourceType: true, amount: true },
    });

    const byType = new Map<string, { in: number; out: number }>();
    let cashIn = 0;
    let cashOut = 0;
    let bankIn = 0;
    let bankOut = 0;

    for (const m of movements) {
      const amt = Number(m.amount);
      const isIn =
        m.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN ||
        m.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_IN;
      const bucket = byType.get(m.movementType) ?? { in: 0, out: 0 };
      if (isIn) bucket.in += amt;
      else bucket.out += amt;
      byType.set(m.movementType, bucket);

      if (m.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH) {
        if (isIn) cashIn += amt;
        else cashOut += amt;
      } else {
        if (isIn) bankIn += amt;
        else bankOut += amt;
      }
    }

    let totalIn = 0;
    let totalOut = 0;
    const rows = [...byType.entries()].map(([movementType, v]) => {
      totalIn += v.in;
      totalOut += v.out;
      return {
        movementType,
        label: CONTABILIDAD_TREASURY_MOVEMENT_TYPE_LABELS[movementType] ?? movementType,
        inAmount: formatPenAmount(v.in),
        outAmount: formatPenAmount(v.out),
        netAmount: formatPenAmount(roundPenAmount(v.in - v.out)),
      };
    });
    rows.sort((a, b) => a.label.localeCompare(b.label));

    return {
      periodId,
      year: period.year,
      month: period.month,
      rows,
      totalIn: formatPenAmount(roundPenAmount(totalIn)),
      totalOut: formatPenAmount(roundPenAmount(totalOut)),
      netChange: formatPenAmount(roundPenAmount(totalIn - totalOut)),
      cashIn: formatPenAmount(roundPenAmount(cashIn)),
      cashOut: formatPenAmount(roundPenAmount(cashOut)),
      bankIn: formatPenAmount(roundPenAmount(bankIn)),
      bankOut: formatPenAmount(roundPenAmount(bankOut)),
    };
  }

  private async requirePeriod(applicationId: string, periodId: string) {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
      select: { year: true, month: true },
    });
    if (!period) throw new Error('Period not found');
    return period;
  }

  private async entryCounts(applicationId: string, periodId: string) {
    const [posted, draft] = await Promise.all([
      this.prisma.contabilidadJournalEntry.count({
        where: { applicationId, periodId, status: CONTABILIDAD_JOURNAL_STATUS.POSTED },
      }),
      this.prisma.contabilidadJournalEntry.count({
        where: { applicationId, periodId, status: CONTABILIDAD_JOURNAL_STATUS.DRAFT },
      }),
    ]);
    return { posted, draft };
  }

  private async treasuryNet(applicationId: string, periodId: string) {
    const rows = await this.prisma.contabilidadTreasuryMovement.groupBy({
      by: ['movementType'],
      where: { applicationId, periodId },
      _sum: { amount: true },
    });
    let inAmt = 0;
    let outAmt = 0;
    for (const r of rows) {
      const amt = Number(r._sum.amount ?? 0);
      if (
        r.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN ||
        r.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_IN
      ) {
        inAmt += amt;
      } else {
        outAmt += amt;
      }
    }
    return { in: roundPenAmount(inAmt), out: roundPenAmount(outAmt), net: roundPenAmount(inAmt - outAmt) };
  }

  private async aggregatePeriodBalances(applicationId: string, periodId: string) {
    const grouped = await this.prisma.contabilidadJournalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          applicationId,
          periodId,
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
      },
      _sum: { debit: true, credit: true },
    });
    const accounts = await this.prisma.contabilidadAccount.findMany({
      where: { applicationId, id: { in: grouped.map((g) => g.accountId) } },
      select: { id: true, code: true, accountType: true },
    });
    const map = new Map(accounts.map((a) => [a.id, a]));
    return grouped.map((g) => {
      const acc = map.get(g.accountId)!;
      return {
        code: acc.code,
        accountType: acc.accountType,
        balance: accountBalanceFromTotals(
          acc.accountType,
          Number(g._sum.debit ?? 0),
          Number(g._sum.credit ?? 0),
        ),
      };
    });
  }

  private sumByCodePrefix(
    rows: { code: string; balance: number }[],
    prefix: string,
  ): number {
    return roundPenAmount(
      rows.filter((r) => r.code.startsWith(prefix)).reduce((s, r) => s + r.balance, 0),
    );
  }

  private async recentActivity(
    applicationId: string,
    periodId: string,
  ): Promise<ContabilidadDashboardActivityDto[]> {
    const entries = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId,
        periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      orderBy: { postedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        entryNumber: true,
        description: true,
        postedAt: true,
        totalDebit: true,
      },
    });

    return entries.map((e) => ({
      id: e.id,
      title: 'Asiento publicado',
      detail: `#${e.entryNumber} — ${e.description} (${formatPenAmount(Number(e.totalDebit))})`,
      occurredAt: (e.postedAt ?? new Date()).toISOString(),
      tone: 'primary' as const,
    }));
  }
}
