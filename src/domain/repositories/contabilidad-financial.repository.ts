export const CONTABILIDAD_FINANCIAL_REPOSITORY = Symbol('ContabilidadFinancialRepository');

export interface FinancialStatementLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  amount: string;
  priorAmount: string | null;
}

export interface BalanceSheetSectionDto {
  lines: FinancialStatementLineDto[];
  total: string;
}

export interface BalanceSheetDto {
  periodId: string;
  priorPeriodId: string | null;
  year: number;
  month: number;
  asOfLabel: string;
  assets: BalanceSheetSectionDto;
  liabilities: BalanceSheetSectionDto;
  equity: BalanceSheetSectionDto;
  netIncomePeriod: string;
  totalLiabilitiesAndEquity: string;
  isBalanced: boolean;
  difference: string;
}

export interface IncomeStatementDto {
  periodId: string;
  priorPeriodId: string | null;
  year: number;
  month: number;
  income: BalanceSheetSectionDto;
  expenses: BalanceSheetSectionDto;
  netIncome: string;
  priorNetIncome: string | null;
}

export interface CashFlowLineDto {
  label: string;
  amount: string;
  priorAmount: string | null;
}

export interface CashFlowStatementDto {
  periodId: string;
  priorPeriodId: string | null;
  year: number;
  month: number;
  method: 'INDIRECT';
  operating: CashFlowLineDto[];
  investing: CashFlowLineDto[];
  financing: CashFlowLineDto[];
  netCashChange: string;
  priorNetCashChange: string | null;
  treasuryInTotal: string;
  treasuryOutTotal: string;
}

export interface ClosingChecklistItemDto {
  id: string;
  label: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export interface ClosingPreviewDto {
  periodId: string;
  year: number;
  month: number;
  periodStatus: string;
  canClose: boolean;
  checklist: ClosingChecklistItemDto[];
  balanceSheetPreview: {
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    isBalanced: boolean;
  };
  incomeStatementPreview: {
    netIncome: string;
  };
}

export interface ContabilidadFinancialRepository {
  getBalanceSheet(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<BalanceSheetDto>;

  getIncomeStatement(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<IncomeStatementDto>;

  getCashFlowStatement(
    applicationId: string,
    periodId: string,
    priorPeriodId?: string | null,
  ): Promise<CashFlowStatementDto>;

  getClosingPreview(applicationId: string, periodId: string): Promise<ClosingPreviewDto>;

  findPriorPeriodId(applicationId: string, year: number, month: number): Promise<string | null>;
}
