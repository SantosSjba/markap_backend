export const CONTABILIDAD_EXTENSIONS_REPOSITORY = Symbol('ContabilidadExtensionsRepository');

export interface ContabilidadExchangeRateDto {
  id: string;
  rateDate: string;
  currencyCode: string;
  buyRate: string;
  sellRate: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContabilidadJournalTemplateLineDto {
  id: string;
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  defaultDebit: string;
  defaultCredit: string;
  costCenterId: string | null;
  costCenterCode: string | null;
  description: string | null;
}

export interface ContabilidadJournalTemplateDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  lines: ContabilidadJournalTemplateLineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ContabilidadInventorySnapshotDto {
  id: string;
  periodId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: string;
  createdAt: string;
}

export interface ContabilidadElectronicDocumentLogDto {
  id: string;
  periodId: string | null;
  documentKind: string;
  documentRef: string;
  sunatStatus: string;
  xmlHash: string | null;
  cdrReference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeTaxSummaryDto {
  periodId: string;
  year: number;
  month: number;
  totalIncome: string;
  totalExpenses: string;
  netIncomeBeforeTax: string;
  rentaAccountBalance: string;
  estimatedTaxProvision: string;
}

export interface ApplyJournalTemplateResultDto {
  templateId: string;
  templateName: string;
  description: string;
  lines: {
    lineNumber: number;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    costCenterId: string | null;
    description: string | null;
  }[];
}

export interface ListExchangeRatesFilters {
  dateFrom?: string;
  dateTo?: string;
  currencyCode?: string;
}

export interface UpsertExchangeRateInput {
  rateDate: string;
  currencyCode: string;
  buyRate: number | string;
  sellRate: number | string;
  source?: string | null;
}

export interface JournalTemplateLineInput {
  lineNumber: number;
  accountId: string;
  defaultDebit?: number | string;
  defaultCredit?: number | string;
  costCenterId?: string | null;
  description?: string | null;
}

export interface CreateJournalTemplateInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  lines: JournalTemplateLineInput[];
}

export interface UpdateJournalTemplateInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  lines?: JournalTemplateLineInput[];
}

export interface ListElectronicDocumentLogsFilters {
  periodId?: string;
  documentKind?: string;
  search?: string;
}

export interface CreateElectronicDocumentLogInput {
  periodId?: string | null;
  documentKind: string;
  documentRef: string;
  sunatStatus?: string;
  xmlHash?: string | null;
  cdrReference?: string | null;
  notes?: string | null;
}

export interface ContabilidadExtensionsRepository {
  listExchangeRates(
    applicationId: string,
    filters: ListExchangeRatesFilters,
  ): Promise<ContabilidadExchangeRateDto[]>;
  upsertExchangeRate(
    applicationId: string,
    input: UpsertExchangeRateInput,
  ): Promise<ContabilidadExchangeRateDto>;

  listJournalTemplates(applicationId: string): Promise<ContabilidadJournalTemplateDto[]>;
  findJournalTemplateById(
    applicationId: string,
    id: string,
  ): Promise<ContabilidadJournalTemplateDto | null>;
  createJournalTemplate(
    applicationId: string,
    input: CreateJournalTemplateInput,
  ): Promise<ContabilidadJournalTemplateDto>;
  updateJournalTemplate(
    applicationId: string,
    id: string,
    input: UpdateJournalTemplateInput,
  ): Promise<ContabilidadJournalTemplateDto>;
  deleteJournalTemplate(applicationId: string, id: string): Promise<void>;
  applyJournalTemplate(applicationId: string, templateId: string): Promise<ApplyJournalTemplateResultDto>;

  generateInventorySnapshot(
    applicationId: string,
    periodId: string,
  ): Promise<ContabilidadInventorySnapshotDto[]>;
  listInventorySnapshots(
    applicationId: string,
    periodId: string,
  ): Promise<ContabilidadInventorySnapshotDto[]>;

  listElectronicDocumentLogs(
    applicationId: string,
    filters: ListElectronicDocumentLogsFilters,
  ): Promise<ContabilidadElectronicDocumentLogDto[]>;
  createElectronicDocumentLog(
    applicationId: string,
    input: CreateElectronicDocumentLogInput,
  ): Promise<ContabilidadElectronicDocumentLogDto>;

  getIncomeTaxSummary(applicationId: string, periodId: string): Promise<IncomeTaxSummaryDto>;
}
