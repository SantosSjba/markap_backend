export const CONTABILIDAD_SALES_REPOSITORY = Symbol('ContabilidadSalesRepository');

export interface ContabilidadCustomerDto {
  id: string;
  ruc: string;
  businessName: string;
  tradeName: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  receivableBalance: string;
  invoiceCount: number;
  createdAt: string;
}

export interface ContabilidadSalesInvoiceDto {
  id: string;
  customerId: string;
  customerRuc: string;
  customerName: string;
  periodId: string;
  documentType: string;
  series: string;
  number: string;
  fullNumber: string;
  issueDate: string;
  dueDate: string | null;
  taxAffectation: string;
  incomeAccountId: string;
  incomeAccountCode: string;
  incomeAccountName: string;
  taxableBase: string;
  igvAmount: string;
  totalAmount: string;
  collectedAmount: string;
  balanceAmount: string;
  status: string;
  notes: string | null;
  journalEntryId: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ContabilidadSalesCreditNoteDto {
  id: string;
  customerId: string;
  customerRuc: string;
  customerName: string;
  invoiceId: string | null;
  invoiceFullNumber: string | null;
  periodId: string;
  series: string;
  number: string;
  fullNumber: string;
  issueDate: string;
  taxableBase: string;
  igvAmount: string;
  totalAmount: string;
  reason: string | null;
  status: string;
  journalEntryId: string | null;
  createdAt: string;
}

export interface ContabilidadSalesCollectionDto {
  id: string;
  invoiceId: string;
  invoiceFullNumber: string;
  customerRuc: string;
  customerName: string;
  periodId: string;
  amount: string;
  collectionDate: string;
  description: string;
  sourceType: string;
  cashBoxId: string | null;
  cashBoxCode: string | null;
  bankAccountId: string | null;
  bankCode: string | null;
  treasuryMovementId: string | null;
  journalEntryId: string | null;
  createdAt: string;
}

export interface ListCustomersFilters {
  search?: string;
  activeOnly?: boolean;
}

export interface ListSalesInvoicesFilters {
  periodId?: string;
  customerId?: string;
  documentType?: string;
  status?: string;
  search?: string;
}

export interface ListSalesCreditNotesFilters {
  periodId?: string;
  customerId?: string;
  search?: string;
}

export interface ListSalesCollectionsFilters {
  periodId?: string;
  customerId?: string;
  invoiceId?: string;
}

export interface CreateCustomerInput {
  ruc: string;
  businessName: string;
  tradeName?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateCustomerInput {
  businessName?: string;
  tradeName?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface CreateSalesInvoiceInput {
  customerId: string;
  periodId: string;
  documentType: string;
  series: string;
  number: string;
  issueDate: string;
  dueDate?: string | null;
  taxAffectation: string;
  incomeAccountId: string;
  taxableBase: number | string;
  igvAmount?: number | string;
  notes?: string | null;
}

export interface CreateSalesCreditNoteInput {
  customerId: string;
  invoiceId?: string | null;
  periodId: string;
  series: string;
  number: string;
  issueDate: string;
  taxableBase: number | string;
  igvAmount?: number | string;
  reason?: string | null;
}

export interface CreateSalesCollectionInput {
  invoiceId: string;
  periodId: string;
  amount: number | string;
  collectionDate: string;
  description: string;
  sourceType: 'CASH' | 'BANK';
  cashBoxId?: string | null;
  bankAccountId?: string | null;
}

export interface ContabilidadSalesRepository {
  listCustomers(applicationId: string, filters: ListCustomersFilters): Promise<ContabilidadCustomerDto[]>;
  findCustomerById(applicationId: string, id: string): Promise<ContabilidadCustomerDto | null>;
  createCustomer(applicationId: string, input: CreateCustomerInput): Promise<ContabilidadCustomerDto>;
  updateCustomer(applicationId: string, id: string, input: UpdateCustomerInput): Promise<ContabilidadCustomerDto>;

  listInvoices(applicationId: string, filters: ListSalesInvoicesFilters): Promise<ContabilidadSalesInvoiceDto[]>;
  findInvoiceById(applicationId: string, id: string): Promise<ContabilidadSalesInvoiceDto | null>;
  createInvoiceWithJournal(
    applicationId: string,
    input: CreateSalesInvoiceInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesInvoiceDto>;
  cancelInvoice(applicationId: string, id: string): Promise<ContabilidadSalesInvoiceDto>;

  listCreditNotes(
    applicationId: string,
    filters: ListSalesCreditNotesFilters,
  ): Promise<ContabilidadSalesCreditNoteDto[]>;
  createCreditNoteWithJournal(
    applicationId: string,
    input: CreateSalesCreditNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesCreditNoteDto>;

  listCollections(
    applicationId: string,
    filters: ListSalesCollectionsFilters,
  ): Promise<ContabilidadSalesCollectionDto[]>;
  createCollectionWithTreasury(
    applicationId: string,
    input: CreateSalesCollectionInput,
    receivableAccountId: string,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesCollectionDto>;
}
