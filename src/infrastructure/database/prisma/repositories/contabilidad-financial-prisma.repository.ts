import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_JOURNAL_REPOSITORY } from '@common/constants/injection-tokens';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_MONTH_LABELS } from '@domain/constants/contabilidad-period.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import { CONTABILIDAD_ACCOUNT_TYPES } from '@domain/constants/contabilidad-pcge.defaults';
import {
  accountBalanceFromTotals,
  CLOSING_CHECK_IDS,
} from '@domain/constants/contabilidad-financial.defaults';
import { CONTABILIDAD_RECONCILIATION_STATUS } from '@domain/constants/contabilidad-treasury.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  BalanceSheetDto,
  BalanceSheetSectionDto,
  CashFlowStatementDto,
  ClosingChecklistItemDto,
  ClosingPreviewDto,
  ClosingRegularizationResultDto,
  ContabilidadFinancialRepository,
  FinancialStatementLineDto,
  IncomeStatementDto,
} from '@domain/repositories/contabilidad-financial.repository';
import { formatPenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { PrismaService } from '../prisma.service';

interface PeriodRow {
  id: string;
  year: number;
  month: number;
  status: string;
}

interface AccountBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  isMovement: boolean;
  totalDebit: number;
  totalCredit: number;
}

@Injectable()
export class ContabilidadFinancialPrismaRepository implements ContabilidadFinancialRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTABILIDAD_JOURNAL_REPOSITORY)
    private readonly journal: ContabilidadJournalRepository,
  ) {}

  async findPriorPeriodId(applicationId: string, year: number, month: number): Promise<string | null> {
    if (month <= 1) {
      const prior = await this.prisma.contabilidadPeriod.findFirst({
        where: { applicationId, year: year - 1, month: 12 },
        select: { id: true },
      });
      return prior?.id ?? null;
    }
    const prior = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, year, month: month - 1 },
      select: { id: true },
    });
    return prior?.id ?? null;
  }

  async getBalanceSheet(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<BalanceSheetDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const priorId =
      priorPeriodId === undefined
        ? await this.findPriorPeriodId(applicationId, period.year, period.month)
        : priorPeriodId;

    const currentBalances = await this.aggregateBalancesThrough(applicationId, period.year, period.month);
    const priorBalances =
      priorId != null
        ? await this.aggregateBalancesThrough(
            applicationId,
            ...(await this.periodYearMonth(applicationId, priorId)),
          )
        : new Map<string, AccountBalanceRow>();

    const incomeCurrent = await this.netIncomeThrough(applicationId, period.year, period.month);
    const incomePrior =
      priorId != null
        ? await this.netIncomeThrough(
            applicationId,
            ...(await this.periodYearMonth(applicationId, priorId)),
          )
        : null;

    const assets = this.buildSection(
      currentBalances,
      priorBalances,
      [CONTABILIDAD_ACCOUNT_TYPES.ASSET],
      false,
    );
    const liabilities = this.buildSection(
      currentBalances,
      priorBalances,
      [CONTABILIDAD_ACCOUNT_TYPES.LIABILITY],
      false,
    );
    const equityAccounts = this.buildSection(
      currentBalances,
      priorBalances,
      [CONTABILIDAD_ACCOUNT_TYPES.EQUITY],
      false,
    );

    const netIncomeLine: FinancialStatementLineDto = {
      accountId: '__net_income__',
      accountCode: '—',
      accountName: 'Resultado del periodo (acumulado en el mes)',
      accountType: CONTABILIDAD_ACCOUNT_TYPES.EQUITY,
      level: 3,
      amount: formatPenAmount(incomeCurrent),
      priorAmount: incomePrior != null ? formatPenAmount(incomePrior) : null,
    };

    const equityLines = [...equityAccounts.lines];
    if (Math.abs(incomeCurrent) >= 0.005 || (incomePrior != null && Math.abs(incomePrior) >= 0.005)) {
      equityLines.push(netIncomeLine);
    }
    const equityTotal = roundPenAmount(
      Number(equityAccounts.total) + incomeCurrent,
    );
    const equity: BalanceSheetSectionDto = {
      lines: equityLines,
      total: formatPenAmount(equityTotal),
    };

    const totalAssets = Number(assets.total);
    const totalLiabilities = Number(liabilities.total);
    const totalLiabEquity = roundPenAmount(totalLiabilities + equityTotal);
    const difference = roundPenAmount(totalAssets - totalLiabEquity);

    return {
      periodId,
      priorPeriodId: priorId,
      year: period.year,
      month: period.month,
      asOfLabel: `${CONTABILIDAD_MONTH_LABELS[period.month]} ${period.year}`,
      assets,
      liabilities,
      equity,
      netIncomePeriod: formatPenAmount(incomeCurrent),
      totalLiabilitiesAndEquity: formatPenAmount(totalLiabEquity),
      isBalanced: Math.abs(difference) < 0.01,
      difference: formatPenAmount(difference),
    };
  }

  async getIncomeStatement(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<IncomeStatementDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const priorId =
      priorPeriodId === undefined
        ? await this.findPriorPeriodId(applicationId, period.year, period.month)
        : priorPeriodId;

    const current = await this.aggregateBalancesForPeriod(applicationId, periodId);
    const prior =
      priorId != null
        ? await this.aggregateBalancesForPeriod(applicationId, priorId)
        : new Map<string, AccountBalanceRow>();

    const income = this.buildSection(
      current,
      prior,
      [CONTABILIDAD_ACCOUNT_TYPES.INCOME],
      true,
    );
    const expenses = this.buildSection(
      current,
      prior,
      [CONTABILIDAD_ACCOUNT_TYPES.EXPENSE],
      true,
    );

    const netIncome = roundPenAmount(Number(income.total) - Number(expenses.total));
    let priorNet: number | null = null;
    if (priorId != null) {
      const pIncome = this.buildSection(prior, new Map(), [CONTABILIDAD_ACCOUNT_TYPES.INCOME], true);
      const pExp = this.buildSection(prior, new Map(), [CONTABILIDAD_ACCOUNT_TYPES.EXPENSE], true);
      priorNet = roundPenAmount(Number(pIncome.total) - Number(pExp.total));
    }

    return {
      periodId,
      priorPeriodId: priorId,
      year: period.year,
      month: period.month,
      income,
      expenses,
      netIncome: formatPenAmount(netIncome),
      priorNetIncome: priorNet != null ? formatPenAmount(priorNet) : null,
    };
  }

  async getCashFlowStatement(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<CashFlowStatementDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const priorId =
      priorPeriodId === undefined
        ? await this.findPriorPeriodId(applicationId, period.year, period.month)
        : priorPeriodId;

    const incomeStmt = await this.getIncomeStatement(applicationId, periodId, priorId);
    const netIncome = Number(incomeStmt.netIncome);
    const priorNet = incomeStmt.priorNetIncome != null ? Number(incomeStmt.priorNetIncome) : null;

    const currentThrough = await this.aggregateBalancesThrough(applicationId, period.year, period.month);
    let priorThrough = new Map<string, AccountBalanceRow>();
    let priorPriorThrough = new Map<string, AccountBalanceRow>();
    if (priorId != null) {
      const [py, pm] = await this.periodYearMonth(applicationId, priorId);
      priorThrough = await this.aggregateBalancesThrough(applicationId, py, pm);
      const priorPriorId = await this.findPriorPeriodId(applicationId, py, pm);
      if (priorPriorId != null) {
        const [ppy, ppm] = await this.periodYearMonth(applicationId, priorPriorId);
        priorPriorThrough = await this.aggregateBalancesThrough(applicationId, ppy, ppm);
      }
    }

    const receivableChange = this.balanceChangeByCodePrefix(currentThrough, priorThrough, '104');
    const payableChange = this.balanceChangeByCodePrefix(currentThrough, priorThrough, '42');
    const fixedAssetChange = this.balanceChangeByCodePrefix(currentThrough, priorThrough, '33');
    const loanChange = this.balanceChangeByCodePrefix(currentThrough, priorThrough, '45');

    const priorReceivableChange =
      priorThrough.size > 0
        ? this.balanceChangeByCodePrefix(priorThrough, priorPriorThrough, '104')
        : null;
    const priorPayableChange =
      priorThrough.size > 0
        ? this.balanceChangeByCodePrefix(priorThrough, priorPriorThrough, '42')
        : null;
    const priorFixedAssetChange =
      priorThrough.size > 0
        ? this.balanceChangeByCodePrefix(priorThrough, priorPriorThrough, '33')
        : null;
    const priorLoanChange =
      priorThrough.size > 0
        ? this.balanceChangeByCodePrefix(priorThrough, priorPriorThrough, '45')
        : null;

    const operating = [
      { label: 'Utilidad neta', amount: formatPenAmount(netIncome), priorAmount: priorNet != null ? formatPenAmount(priorNet) : null },
      {
        label: 'Variación cuentas por cobrar',
        amount: formatPenAmount(-receivableChange),
        priorAmount: priorReceivableChange != null ? formatPenAmount(-priorReceivableChange) : null,
      },
      {
        label: 'Variación cuentas por pagar',
        amount: formatPenAmount(payableChange),
        priorAmount: priorPayableChange != null ? formatPenAmount(priorPayableChange) : null,
      },
    ];
    const operatingTotal = roundPenAmount(
      netIncome - receivableChange + payableChange,
    );
    const priorOperatingTotal =
      priorNet != null && priorReceivableChange != null && priorPayableChange != null
        ? roundPenAmount(priorNet - priorReceivableChange + priorPayableChange)
        : null;
    operating.push({
      label: 'Flujo neto operativo',
      amount: formatPenAmount(operatingTotal),
      priorAmount: priorOperatingTotal != null ? formatPenAmount(priorOperatingTotal) : null,
    });

    const investing = [
      {
        label: 'Variación activos fijos (clase 33)',
        amount: formatPenAmount(-fixedAssetChange),
        priorAmount: priorFixedAssetChange != null ? formatPenAmount(-priorFixedAssetChange) : null,
      },
    ];
    const investingTotal = -fixedAssetChange;

    const financing = [
      {
        label: 'Variación préstamos (clase 45)',
        amount: formatPenAmount(loanChange),
        priorAmount: priorLoanChange != null ? formatPenAmount(priorLoanChange) : null,
      },
    ];
    const financingTotal = loanChange;

    const netCashChange = roundPenAmount(operatingTotal + investingTotal + financingTotal);

    const treasury = await this.treasuryTotals(applicationId, periodId);
    const priorTreasury =
      priorId != null ? await this.treasuryTotals(applicationId, priorId) : null;

    return {
      periodId,
      priorPeriodId: priorId,
      year: period.year,
      month: period.month,
      method: 'INDIRECT',
      operating,
      investing,
      financing,
      netCashChange: formatPenAmount(netCashChange),
      priorNetCashChange:
        priorTreasury != null
          ? formatPenAmount(priorTreasury.inTotal - priorTreasury.outTotal)
          : null,
      treasuryInTotal: formatPenAmount(treasury.inTotal),
      treasuryOutTotal: formatPenAmount(treasury.outTotal),
    };
  }

  async getClosingPreview(applicationId: string, periodId: string): Promise<ClosingPreviewDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    const checklist: ClosingChecklistItemDto[] = [];

    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      checklist.push({
        id: CLOSING_CHECK_IDS.PERIOD_OPEN,
        label: 'Periodo abierto',
        status: 'error',
        message: 'El periodo ya está cerrado.',
      });
    } else {
      checklist.push({
        id: CLOSING_CHECK_IDS.PERIOD_OPEN,
        label: 'Periodo abierto',
        status: 'ok',
        message: 'El periodo permite cierre.',
      });
    }

    const draftCount = await this.prisma.contabilidadJournalEntry.count({
      where: { applicationId, periodId, status: CONTABILIDAD_JOURNAL_STATUS.DRAFT },
    });
    checklist.push({
      id: CLOSING_CHECK_IDS.NO_DRAFT_ENTRIES,
      label: 'Asientos en borrador',
      status: draftCount === 0 ? 'ok' : 'error',
      message:
        draftCount === 0
          ? 'No hay asientos en borrador.'
          : `${draftCount} asiento(s) en borrador deben publicarse o eliminarse.`,
    });

    const unbalanced = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId,
        periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      select: { id: true, totalDebit: true, totalCredit: true, entryNumber: true },
    });
    const unbalancedCount = unbalanced.filter(
      (e) => Math.abs(Number(e.totalDebit) - Number(e.totalCredit)) >= 0.01,
    ).length;
    checklist.push({
      id: CLOSING_CHECK_IDS.NO_UNBALANCED,
      label: 'Asientos balanceados',
      status: unbalancedCount === 0 ? 'ok' : 'error',
      message:
        unbalancedCount === 0
          ? 'Todos los asientos publicados están balanceados.'
          : `${unbalancedCount} asiento(s) publicado(s) con debe ≠ haber.`,
    });

    const trial = await this.prisma.contabilidadJournalEntryLine.aggregate({
      where: {
        journalEntry: {
          applicationId,
          periodId,
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
      },
      _sum: { debit: true, credit: true },
    });
    const trialDebit = Number(trial._sum.debit ?? 0);
    const trialCredit = Number(trial._sum.credit ?? 0);
    const trialOk = Math.abs(trialDebit - trialCredit) < 0.01;
    checklist.push({
      id: CLOSING_CHECK_IDS.TRIAL_BALANCE,
      label: 'Balance de comprobación',
      status: trialOk ? 'ok' : 'error',
      message: trialOk
        ? `Debe y haber cuadran (${formatPenAmount(trialDebit)}).`
        : `Descuadre: Debe ${formatPenAmount(trialDebit)} vs Haber ${formatPenAmount(trialCredit)}.`,
    });

    const openRecons = await this.prisma.contabilidadBankReconciliation.count({
      where: {
        applicationId,
        periodId,
        status: CONTABILIDAD_RECONCILIATION_STATUS.OPEN,
      },
    });
    checklist.push({
      id: CLOSING_CHECK_IDS.BANK_RECONCILIATION,
      label: 'Conciliaciones bancarias',
      status: openRecons === 0 ? 'ok' : 'warning',
      message:
        openRecons === 0
          ? 'No hay conciliaciones bancarias abiertas.'
          : `${openRecons} conciliación(es) bancaria(s) aún abiertas (recomendado cerrar).`,
    });

    const balanceSheet = await this.getBalanceSheet(applicationId, periodId);
    const incomeStatement = await this.getIncomeStatement(applicationId, periodId);

    const canClose =
      period.status === CONTABILIDAD_PERIOD_STATUS.OPEN &&
      checklist.every((c) => c.status !== 'error');

    return {
      periodId,
      year: period.year,
      month: period.month,
      periodStatus: period.status,
      canClose,
      checklist,
      balanceSheetPreview: {
        totalAssets: balanceSheet.assets.total,
        totalLiabilities: balanceSheet.liabilities.total,
        totalEquity: balanceSheet.equity.total,
        isBalanced: balanceSheet.isBalanced,
      },
      incomeStatementPreview: {
        netIncome: incomeStatement.netIncome,
      },
    };
  }

  async createClosingRegularizationEntry(
    applicationId: string,
    periodId: string,
    createdBy?: string | null,
  ): Promise<ClosingRegularizationResultDto> {
    const period = await this.requirePeriod(applicationId, periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new Error('El periodo debe estar abierto para regularizar.');
    }

    const balances = await this.aggregateBalancesForPeriod(applicationId, periodId);
    const lines: {
      accountId: string;
      debit?: number;
      credit?: number;
      description?: string;
    }[] = [];

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of balances.values()) {
      const bal = accountBalanceFromTotals(row.accountType, row.totalDebit, row.totalCredit);
      if (Math.abs(bal) < 0.005) continue;

      if (row.accountType === CONTABILIDAD_ACCOUNT_TYPES.INCOME) {
        totalIncome += bal;
        lines.push({
          accountId: row.accountId,
          debit: roundPenAmount(bal),
          description: `Cierre ${row.accountCode}`,
        });
      } else if (row.accountType === CONTABILIDAD_ACCOUNT_TYPES.EXPENSE) {
        totalExpense += bal;
        lines.push({
          accountId: row.accountId,
          credit: roundPenAmount(bal),
          description: `Cierre ${row.accountCode}`,
        });
      }
    }

    const netIncome = roundPenAmount(totalIncome - totalExpense);
    if (lines.length === 0 && Math.abs(netIncome) < 0.005) {
      throw new Error('No hay cuentas de ingreso o gasto con saldo para regularizar.');
    }

    const profitCode = netIncome >= 0 ? '591' : '592';
    const profitAccount = await this.prisma.contabilidadAccount.findFirst({
      where: { applicationId, code: profitCode, isActive: true, isMovement: true },
    });
    if (!profitAccount) {
      throw new Error(`Cuenta ${profitCode} no disponible para el asiento de cierre.`);
    }

    const offsetAmount = roundPenAmount(Math.abs(netIncome));
    if (offsetAmount >= 0.005) {
      if (netIncome >= 0) {
        lines.push({
          accountId: profitAccount.id,
          credit: offsetAmount,
          description: 'Utilidad del ejercicio',
        });
      } else {
        lines.push({
          accountId: profitAccount.id,
          debit: offsetAmount,
          description: 'Pérdida del ejercicio',
        });
      }
    }

    const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
    const entryDate = `${period.year}-${String(period.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const description = `Regularización de cierre ${CONTABILIDAD_MONTH_LABELS[period.month]} ${period.year}`;

    const journal = await this.journal.createAndPost(
      applicationId,
      { periodId, entryDate, description, lines },
      createdBy,
    );

    return {
      journalEntryId: journal.id,
      entryNumber: journal.entryNumber,
      netIncome: formatPenAmount(netIncome),
      profitAccountCode: profitCode,
      description,
    };
  }

  private async requirePeriod(applicationId: string, periodId: string): Promise<PeriodRow> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
      select: { id: true, year: true, month: true, status: true },
    });
    if (!period) throw new Error('Period not found');
    return period;
  }

  private async periodYearMonth(applicationId: string, periodId: string): Promise<[number, number]> {
    const p = await this.requirePeriod(applicationId, periodId);
    return [p.year, p.month];
  }

  private async periodIdsThrough(applicationId: string, year: number, month: number): Promise<string[]> {
    const rows = await this.prisma.contabilidadPeriod.findMany({
      where: {
        applicationId,
        OR: [{ year: { lt: year } }, { year, month: { lte: month } }],
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private async aggregateBalancesThrough(
    applicationId: string,
    year: number,
    month: number,
  ): Promise<Map<string, AccountBalanceRow>> {
    const periodIds = await this.periodIdsThrough(applicationId, year, month);
    return this.aggregateBalancesForPeriodIds(applicationId, periodIds);
  }

  private async aggregateBalancesForPeriod(
    applicationId: string,
    periodId: string,
  ): Promise<Map<string, AccountBalanceRow>> {
    return this.aggregateBalancesForPeriodIds(applicationId, [periodId]);
  }

  private async aggregateBalancesForPeriodIds(
    applicationId: string,
    periodIds: string[],
  ): Promise<Map<string, AccountBalanceRow>> {
    if (!periodIds.length) return new Map();

    const grouped = await this.prisma.contabilidadJournalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          applicationId,
          periodId: { in: periodIds },
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
      },
      _sum: { debit: true, credit: true },
    });

    if (!grouped.length) return new Map();

    const accountIds = grouped.map((g) => g.accountId);
    const accounts = await this.prisma.contabilidadAccount.findMany({
      where: { applicationId, id: { in: accountIds } },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        level: true,
        isMovement: true,
      },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const result = new Map<string, AccountBalanceRow>();
    for (const g of grouped) {
      const acc = accountMap.get(g.accountId);
      if (!acc) continue;
      result.set(g.accountId, {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.accountType,
        level: acc.level,
        isMovement: acc.isMovement,
        totalDebit: Number(g._sum.debit ?? 0),
        totalCredit: Number(g._sum.credit ?? 0),
      });
    }
    return result;
  }

  private buildSection(
    current: Map<string, AccountBalanceRow>,
    prior: Map<string, AccountBalanceRow>,
    types: string[],
    periodOnly: boolean,
  ): BalanceSheetSectionDto {
    const lines: FinancialStatementLineDto[] = [];
    let total = 0;

    const ids = new Set([...current.keys(), ...prior.keys()]);
    for (const id of ids) {
      const cur = current.get(id);
      const prv = prior.get(id);
      const meta = cur ?? prv;
      if (!meta || !types.includes(meta.accountType)) continue;
      const amount = cur
        ? accountBalanceFromTotals(cur.accountType, cur.totalDebit, cur.totalCredit)
        : 0;
      const priorAmount = prv
        ? accountBalanceFromTotals(prv.accountType, prv.totalDebit, prv.totalCredit)
        : null;
      if (periodOnly && Math.abs(amount) < 0.005) continue;
      if (
        !periodOnly &&
        Math.abs(amount) < 0.005 &&
        (priorAmount == null || Math.abs(priorAmount) < 0.005)
      ) {
        continue;
      }
      lines.push({
        accountId: meta.accountId,
        accountCode: meta.accountCode,
        accountName: meta.accountName,
        accountType: meta.accountType,
        level: meta.level,
        amount: formatPenAmount(amount),
        priorAmount: priorAmount != null ? formatPenAmount(priorAmount) : null,
      });
      total += amount;
    }

    lines.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    return { lines, total: formatPenAmount(roundPenAmount(total)) };
  }

  private async netIncomeForPeriod(applicationId: string, periodId: string): Promise<number> {
    const balances = await this.aggregateBalancesForPeriod(applicationId, periodId);
    return this.netIncomeFromBalances(balances);
  }

  private async netIncomeThrough(applicationId: string, year: number, month: number): Promise<number> {
    const periodIds = await this.prisma.contabilidadPeriod.findMany({
      where: { applicationId, year, month: { lte: month } },
      select: { id: true },
    });
    const balances = await this.aggregateBalancesForPeriodIds(
      applicationId,
      periodIds.map((p) => p.id),
    );
    return this.netIncomeFromBalances(balances);
  }

  private netIncomeFromBalances(balances: Map<string, AccountBalanceRow>): number {
    let income = 0;
    let expense = 0;
    for (const row of balances.values()) {
      const bal = accountBalanceFromTotals(row.accountType, row.totalDebit, row.totalCredit);
      if (row.accountType === CONTABILIDAD_ACCOUNT_TYPES.INCOME) income += bal;
      if (row.accountType === CONTABILIDAD_ACCOUNT_TYPES.EXPENSE) expense += bal;
    }
    return roundPenAmount(income - expense);
  }

  private balanceChangeByCodePrefix(
    currentThrough: Map<string, AccountBalanceRow>,
    priorThrough: Map<string, AccountBalanceRow>,
    prefix: string,
  ): number {
    const sumPrefix = (map: Map<string, AccountBalanceRow>) => {
      let t = 0;
      for (const row of map.values()) {
        if (!row.accountCode.startsWith(prefix)) continue;
        t += accountBalanceFromTotals(row.accountType, row.totalDebit, row.totalCredit);
      }
      return roundPenAmount(t);
    };
    return roundPenAmount(sumPrefix(currentThrough) - sumPrefix(priorThrough));
  }

  private async treasuryTotals(applicationId: string, periodId: string) {
    const rows = await this.prisma.contabilidadTreasuryMovement.groupBy({
      by: ['movementType'],
      where: { applicationId, periodId },
      _sum: { amount: true },
    });
    let inTotal = 0;
    let outTotal = 0;
    for (const r of rows) {
      const amt = Number(r._sum.amount ?? 0);
      if (
        r.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN ||
        r.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_IN
      ) {
        inTotal += amt;
      } else {
        outTotal += amt;
      }
    }
    return { inTotal: roundPenAmount(inTotal), outTotal: roundPenAmount(outTotal) };
  }
}
