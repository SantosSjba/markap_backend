export interface InteriorFinanceBudgetRefDto {
  id: string;
  code: string;
  version: number;
  grandTotal: number;
  taxableTotal: number;
  igvTotal: number;
  status: string;
}

export interface InteriorFinanceScheduleDto {
  id: string;
  kind: string;
  dueDate: string;
  amount: number;
  concept: string;
  sortOrder: number;
  status: string;
  paidTowardSchedule: number;
}

export interface InteriorFinancePaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  concept: string;
  paymentType: string;
  status: string;
  scheduleItemId: string | null;
}

export interface InteriorFinanceExpenseLineDto {
  id: string;
  costCategory: string;
  concept: string;
  amount: number;
  occurredAt: string;
}

export interface InteriorFinanceIncomeSummaryDto {
  scheduledTotal: number;
  advancesScheduled: number;
  installmentsScheduled: number;
  collectedConfirmed: number;
  pendingFromClient: number;
}

export interface InteriorFinanceExpenseSummaryDto {
  purchases: number;
  labor: number;
  transport: number;
  otherExpenses: number;
  totalOut: number;
}

export interface InteriorFinanceProfitabilityDto {
  contractValue: number;
  totalScheduled: number;
  totalCollected: number;
  totalActualCosts: number;
  budgetVsCosts: number;
  collectedVsCosts: number;
  marginOnCollectedPct: number | null;
}

export interface InteriorFinanceCashFlowMonthDto {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface InteriorFinanceMovementDto {
  occurredAt: string;
  direction: 'IN' | 'OUT';
  concept: string;
  amount: number;
  refKind: 'PAYMENT' | 'COST';
}

export interface InteriorFinanceOverviewDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  budgetReference: InteriorFinanceBudgetRefDto | null;
  schedules: InteriorFinanceScheduleDto[];
  payments: InteriorFinancePaymentDto[];
  expenseLines: InteriorFinanceExpenseLineDto[];
  incomeSummary: InteriorFinanceIncomeSummaryDto;
  expenseSummary: InteriorFinanceExpenseSummaryDto;
  profitability: InteriorFinanceProfitabilityDto;
  cashFlowByMonth: InteriorFinanceCashFlowMonthDto[];
  recentMovements: InteriorFinanceMovementDto[];
}

export interface CreateInteriorFinanceSchedulePayload {
  kind: string;
  dueDate: Date;
  amount: number;
  concept: string;
  sortOrder?: number;
}

export interface UpdateInteriorFinanceSchedulePayload {
  kind?: string;
  dueDate?: Date;
  amount?: number;
  concept?: string;
  sortOrder?: number;
  status?: string;
}

export interface CreateInteriorFinancePaymentPayload {
  paidAt: Date;
  amount: number;
  concept: string;
  paymentType?: string;
  status: string;
  scheduleItemId?: string | null;
}

export interface UpdateInteriorFinancePaymentPayload {
  paidAt?: Date;
  amount?: number;
  concept?: string;
  paymentType?: string;
  status?: string;
  scheduleItemId?: string | null;
}

export interface InteriorFinanceRepository {
  ensureProjectScope(projectId: string, applicationSlug?: string): Promise<boolean>;
  getOverview(projectId: string, applicationSlug?: string): Promise<InteriorFinanceOverviewDto | null>;

  createSchedule(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateInteriorFinanceSchedulePayload,
  ): Promise<InteriorFinanceScheduleDto>;
  updateSchedule(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorFinanceSchedulePayload,
  ): Promise<InteriorFinanceScheduleDto>;
  deleteSchedule(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
  ): Promise<void>;

  createPayment(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateInteriorFinancePaymentPayload,
  ): Promise<InteriorFinancePaymentDto>;
  updatePayment(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorFinancePaymentPayload,
  ): Promise<InteriorFinancePaymentDto>;
  deletePayment(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
  ): Promise<void>;
}

export const INTERIOR_FINANCE_REPOSITORY = Symbol('InteriorFinanceRepository');
