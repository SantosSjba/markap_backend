export const CONTABILIDAD_JOURNAL_REPOSITORY = Symbol('ContabilidadJournalRepository');

export interface ContabilidadJournalLineInput {
  accountId: string;
  debit?: number | string;
  credit?: number | string;
  costCenterId?: string | null;
  auxiliaryRuc?: string | null;
  auxiliaryDoc?: string | null;
  description?: string | null;
}

export interface CreateContabilidadJournalEntryInput {
  periodId: string;
  entryDate: string;
  description: string;
  lines: ContabilidadJournalLineInput[];
}

export interface UpdateContabilidadJournalEntryInput {
  entryDate?: string;
  description?: string;
  lines?: ContabilidadJournalLineInput[];
}

export interface ListContabilidadJournalEntriesFilters {
  periodId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  costCenterId?: string;
  search?: string;
}

export interface ContabilidadJournalLineDto {
  id: string;
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  costCenterId: string | null;
  costCenterCode: string | null;
  costCenterName: string | null;
  auxiliaryRuc: string | null;
  auxiliaryDoc: string | null;
  description: string | null;
}

export interface ContabilidadJournalEntryListItemDto {
  id: string;
  periodId: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  status: string;
  totalDebit: string;
  totalCredit: string;
  lineCount: number;
  postedAt: string | null;
  reversalOfId: string | null;
}

export interface ContabilidadJournalEntryDetailDto extends ContabilidadJournalEntryListItemDto {
  lines: ContabilidadJournalLineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ContabilidadJournalRepository {
  list(
    applicationId: string,
    filters: ListContabilidadJournalEntriesFilters,
  ): Promise<ContabilidadJournalEntryListItemDto[]>;
  findById(applicationId: string, id: string): Promise<ContabilidadJournalEntryDetailDto | null>;
  createDraft(
    applicationId: string,
    input: CreateContabilidadJournalEntryInput,
    createdBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto>;
  updateDraft(
    applicationId: string,
    id: string,
    input: UpdateContabilidadJournalEntryInput,
  ): Promise<ContabilidadJournalEntryDetailDto>;
  deleteDraft(applicationId: string, id: string): Promise<void>;
  post(applicationId: string, id: string, postedBy?: string | null): Promise<ContabilidadJournalEntryDetailDto>;
  reverse(
    applicationId: string,
    id: string,
    postedBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto>;
  createAndPost(
    applicationId: string,
    input: CreateContabilidadJournalEntryInput,
    postedBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto>;
}
