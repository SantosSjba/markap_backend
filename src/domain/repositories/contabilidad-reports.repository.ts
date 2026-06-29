export const CONTABILIDAD_REPORTS_REPOSITORY = Symbol('ContabilidadReportsRepository');

export interface ContabilidadDashboardKpiDto {
  key: string;
  label: string;
  value: string;
  format: 'money' | 'number' | 'percent' | 'text';
  hint?: string | null;
}

export interface ContabilidadDashboardActivityDto {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  tone: 'primary' | 'success' | 'muted';
}

export interface ContabilidadDashboardDto {
  periodId: string;
  year: number;
  month: number;
  kpis: ContabilidadDashboardKpiDto[];
  recentActivity: ContabilidadDashboardActivityDto[];
}

export interface TrialBalanceLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

export interface TrialBalanceDto {
  periodId: string;
  year: number;
  month: number;
  lines: TrialBalanceLineDto[];
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
}

export interface FinancialRatioDto {
  key: string;
  label: string;
  value: string | null;
  priorValue: string | null;
  unit: 'ratio' | 'percent' | 'money';
  description: string;
}

export interface FinancialAnalysisDto {
  periodId: string;
  priorPeriodId: string | null;
  year: number;
  month: number;
  ratios: FinancialRatioDto[];
}

export interface CashFlowTreasuryRowDto {
  movementType: string;
  label: string;
  inAmount: string;
  outAmount: string;
  netAmount: string;
}

export interface CashFlowTreasuryDto {
  periodId: string;
  year: number;
  month: number;
  rows: CashFlowTreasuryRowDto[];
  totalIn: string;
  totalOut: string;
  netChange: string;
  cashIn: string;
  cashOut: string;
  bankIn: string;
  bankOut: string;
}

export interface ContabilidadReportsRepository {
  getDashboard(applicationId: string, periodId: string, igvPercent: number): Promise<ContabilidadDashboardDto>;
  getTrialBalance(applicationId: string, periodId: string, costCenterId?: string | null): Promise<TrialBalanceDto>;
  getFinancialAnalysis(applicationId: string, periodId: string): Promise<FinancialAnalysisDto>;
  getCashFlowTreasury(applicationId: string, periodId: string): Promise<CashFlowTreasuryDto>;
}
