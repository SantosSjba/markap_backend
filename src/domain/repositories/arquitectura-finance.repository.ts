export interface ArquitecturaFinanceBudgetRefDto {
  id: string;
  code: string;
  version: number;
  grandTotal: number;
  taxableTotal: number;
  igvTotal: number;
  status: string;
}

export interface ArquitecturaFinanceScheduleDto {
  id: string;
  kind: string;
  dueDate: string;
  amount: number;
  concept: string;
  sortOrder: number;
  status: string;
  paidTowardSchedule: number;
}

export interface ArquitecturaFinancePaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  concept: string;
  paymentType: string;
  status: string;
  scheduleItemId: string | null;
}

export interface ArquitecturaFinanceExpenseLineDto {
  id: string;
  costCategory: string;
  concept: string;
  amount: number;
  occurredAt: string;
}

export interface ArquitecturaFinanceIncomeSummaryDto {
  scheduledTotal: number;
  advancesScheduled: number;
  installmentsScheduled: number;
  collectedConfirmed: number;
  pendingFromClient: number;
}

export interface ArquitecturaFinanceExpenseSummaryDto {
  purchases: number;
  labor: number;
  transport: number;
  otherExpenses: number;
  totalOut: number;
}

export interface ArquitecturaFinanceProfitabilityDto {
  contractValue: number;
  totalScheduled: number;
  totalCollected: number;
  totalActualCosts: number;
  budgetVsCosts: number;
  collectedVsCosts: number;
  marginOnCollectedPct: number | null;
}

export interface ArquitecturaFinanceCashFlowMonthDto {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface ArquitecturaFinanceMovementDto {
  occurredAt: string;
  direction: 'IN' | 'OUT';
  concept: string;
  amount: number;
  refKind: 'PAYMENT' | 'COST';
}

export interface ArquitecturaFinanceOverviewDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  budgetReference: ArquitecturaFinanceBudgetRefDto | null;
  schedules: ArquitecturaFinanceScheduleDto[];
  payments: ArquitecturaFinancePaymentDto[];
  expenseLines: ArquitecturaFinanceExpenseLineDto[];
  incomeSummary: ArquitecturaFinanceIncomeSummaryDto;
  expenseSummary: ArquitecturaFinanceExpenseSummaryDto;
  profitability: ArquitecturaFinanceProfitabilityDto;
  cashFlowByMonth: ArquitecturaFinanceCashFlowMonthDto[];
  recentMovements: ArquitecturaFinanceMovementDto[];
}

export interface CreateArquitecturaFinanceSchedulePayload {
  kind: string;
  dueDate: Date;
  amount: number;
  concept: string;
  sortOrder?: number;
}

export interface UpdateArquitecturaFinanceSchedulePayload {
  kind?: string;
  dueDate?: Date;
  amount?: number;
  concept?: string;
  sortOrder?: number;
  status?: string;
}

export interface CreateArquitecturaFinancePaymentPayload {
  paidAt: Date;
  amount: number;
  concept: string;
  paymentType?: string;
  status: string;
  scheduleItemId?: string | null;
}

export interface UpdateArquitecturaFinancePaymentPayload {
  paidAt?: Date;
  amount?: number;
  concept?: string;
  paymentType?: string;
  status?: string;
  scheduleItemId?: string | null;
}

export interface ArquitecturaFinanceRepository {
  ensureProjectScope(projectId: string, applicationSlug?: string): Promise<boolean>;
  getOverview(projectId: string, applicationSlug?: string): Promise<ArquitecturaFinanceOverviewDto | null>;

  createSchedule(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinanceSchedulePayload,
  ): Promise<ArquitecturaFinanceScheduleDto>;
  updateSchedule(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinanceSchedulePayload,
  ): Promise<ArquitecturaFinanceScheduleDto>;
  deleteSchedule(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
  ): Promise<void>;

  createPayment(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinancePaymentPayload,
  ): Promise<ArquitecturaFinancePaymentDto>;
  updatePayment(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinancePaymentPayload,
  ): Promise<ArquitecturaFinancePaymentDto>;
  deletePayment(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
  ): Promise<void>;
}

export const ARQUITECTURA_FINANCE_REPOSITORY = Symbol('ArquitecturaFinanceRepository');
