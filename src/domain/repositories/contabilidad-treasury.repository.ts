export const CONTABILIDAD_TREASURY_REPOSITORY = Symbol('ContabilidadTreasuryRepository');

export interface ContabilidadCashBoxDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  code: string;
  name: string;
  isActive: boolean;
  balance: string;
}

export interface ContabilidadBankAccountDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  code: string;
  bankName: string;
  accountNumber: string;
  cci: string | null;
  currency: string;
  isActive: boolean;
  balance: string;
}

export interface ContabilidadTreasuryMovementDto {
  id: string;
  periodId: string;
  movementType: string;
  sourceType: string;
  cashBoxId: string | null;
  cashBoxCode: string | null;
  cashBoxName: string | null;
  bankAccountId: string | null;
  bankCode: string | null;
  bankName: string | null;
  offsetAccountId: string | null;
  offsetAccountCode: string | null;
  offsetAccountName: string | null;
  transferGroupId: string | null;
  currencyCode: string;
  foreignAmount: string | null;
  exchangeRate: string | null;
  amount: string;
  movementDate: string;
  description: string;
  journalEntryId: string | null;
  reconciliationId: string | null;
  reconciledAt: string | null;
  createdAt: string;
}

export interface ContabilidadBankReconciliationDto {
  id: string;
  bankAccountId: string;
  bankCode: string;
  bankName: string;
  periodId: string;
  statementBalance: string;
  bookBalance: string;
  difference: string;
  reconciledCount: number;
  pendingCount: number;
  notes: string | null;
  status: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTreasuryMovementsFilters {
  periodId?: string;
  cashBoxId?: string;
  bankAccountId?: string;
  movementType?: string;
  sourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  unreconciledOnly?: boolean;
}

export interface CreateCashBoxInput {
  code: string;
  name: string;
  accountId: string;
}

export interface UpdateCashBoxInput {
  code?: string;
  name?: string;
  accountId?: string;
  isActive?: boolean;
}

export interface CreateBankAccountInput {
  code: string;
  bankName: string;
  accountNumber: string;
  cci?: string | null;
  currency?: string;
  accountId: string;
}

export interface UpdateBankAccountInput {
  code?: string;
  bankName?: string;
  accountNumber?: string;
  cci?: string | null;
  currency?: string;
  accountId?: string;
  isActive?: boolean;
}

export interface CreateTreasuryMovementInput {
  periodId: string;
  movementType: 'IN' | 'OUT';
  sourceType: 'CASH' | 'BANK';
  cashBoxId?: string | null;
  bankAccountId?: string | null;
  offsetAccountId: string;
  amount: number | string;
  foreignAmount?: number | string | null;
  exchangeRate?: number | string | null;
  movementDate: string;
  description: string;
}

export interface CreateTreasuryTransferInput {
  periodId: string;
  fromType: 'CASH' | 'BANK';
  fromCashBoxId?: string | null;
  fromBankAccountId?: string | null;
  toType: 'CASH' | 'BANK';
  toCashBoxId?: string | null;
  toBankAccountId?: string | null;
  amount: number | string;
  movementDate: string;
  description: string;
}

export interface UpsertReconciliationInput {
  bankAccountId: string;
  periodId: string;
  statementBalance: number | string;
  notes?: string | null;
}

export interface ContabilidadTreasuryRepository {
  ensureDefaults(applicationId: string): Promise<void>;
  listCashBoxes(applicationId: string): Promise<ContabilidadCashBoxDto[]>;
  findCashBoxById(applicationId: string, id: string): Promise<ContabilidadCashBoxDto | null>;
  createCashBox(applicationId: string, input: CreateCashBoxInput): Promise<ContabilidadCashBoxDto>;
  updateCashBox(applicationId: string, id: string, input: UpdateCashBoxInput): Promise<ContabilidadCashBoxDto>;
  listBankAccounts(applicationId: string): Promise<ContabilidadBankAccountDto[]>;
  findBankAccountById(applicationId: string, id: string): Promise<ContabilidadBankAccountDto | null>;
  createBankAccount(applicationId: string, input: CreateBankAccountInput): Promise<ContabilidadBankAccountDto>;
  updateBankAccount(applicationId: string, id: string, input: UpdateBankAccountInput): Promise<ContabilidadBankAccountDto>;
  listMovements(applicationId: string, filters: ListTreasuryMovementsFilters): Promise<ContabilidadTreasuryMovementDto[]>;
  findMovementById(applicationId: string, id: string): Promise<ContabilidadTreasuryMovementDto | null>;
  createMovementWithJournal(
    applicationId: string,
    input: CreateTreasuryMovementInput,
    createdBy?: string | null,
  ): Promise<ContabilidadTreasuryMovementDto>;
  createTransferWithJournal(
    applicationId: string,
    input: CreateTreasuryTransferInput,
    createdBy?: string | null,
  ): Promise<ContabilidadTreasuryMovementDto[]>;
  getReconciliation(
    applicationId: string,
    bankAccountId: string,
    periodId: string,
  ): Promise<ContabilidadBankReconciliationDto | null>;
  upsertReconciliation(
    applicationId: string,
    input: UpsertReconciliationInput,
  ): Promise<ContabilidadBankReconciliationDto>;
  toggleMovementReconciled(
    applicationId: string,
    reconciliationId: string,
    movementId: string,
    reconciled: boolean,
  ): Promise<ContabilidadBankReconciliationDto>;
  closeReconciliation(applicationId: string, id: string): Promise<ContabilidadBankReconciliationDto>;
}
