export const CONTABILIDAD_PURCHASES_REPOSITORY = Symbol('ContabilidadPurchasesRepository');

export interface ContabilidadSupplierDto {
  id: string;
  ruc: string;
  businessName: string;
  countryCode: string;
  isNonDomiciled: boolean;
  tradeName: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  payableBalance: string;
  invoiceCount: number;
  createdAt: string;
}

export interface ContabilidadPurchaseInvoiceDto {
  id: string;
  supplierId: string;
  supplierRuc: string;
  supplierName: string;
  periodId: string;
  documentType: string;
  series: string;
  number: string;
  fullNumber: string;
  issueDate: string;
  dueDate: string | null;
  taxAffectation: string;
  currencyCode: string;
  exchangeRate: string | null;
  foreignTaxableBase: string | null;
  expenseAccountId: string;
  expenseAccountCode: string;
  expenseAccountName: string;
  taxableBase: string;
  igvAmount: string;
  totalAmount: string;
  detraccionAmount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
  notes: string | null;
  journalEntryId: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ContabilidadPurchaseCreditNoteDto {
  id: string;
  supplierId: string;
  supplierRuc: string;
  supplierName: string;
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

export interface ContabilidadPurchaseDebitNoteDto {
  id: string;
  supplierId: string;
  supplierRuc: string;
  supplierName: string;
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

export interface ContabilidadPurchasePaymentDto {
  id: string;
  invoiceId: string;
  invoiceFullNumber: string;
  supplierRuc: string;
  supplierName: string;
  periodId: string;
  amount: string;
  paymentDate: string;
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

export interface ListSuppliersFilters {
  search?: string;
  activeOnly?: boolean;
}

export interface ListPurchaseInvoicesFilters {
  periodId?: string;
  supplierId?: string;
  status?: string;
  search?: string;
}

export interface ListPurchaseCreditNotesFilters {
  periodId?: string;
  supplierId?: string;
  search?: string;
}

export interface ListPurchaseDebitNotesFilters {
  periodId?: string;
  supplierId?: string;
  search?: string;
}

export interface ListPurchasePaymentsFilters {
  periodId?: string;
  supplierId?: string;
  invoiceId?: string;
}

export interface CreateSupplierInput {
  ruc: string;
  businessName: string;
  countryCode?: string;
  isNonDomiciled?: boolean;
  tradeName?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateSupplierInput {
  businessName?: string;
  countryCode?: string;
  isNonDomiciled?: boolean;
  tradeName?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface CreatePurchaseInvoiceInput {
  supplierId: string;
  periodId: string;
  documentType: string;
  series: string;
  number: string;
  issueDate: string;
  dueDate?: string | null;
  taxAffectation: string;
  currencyCode?: string;
  exchangeRate?: number | string | null;
  foreignTaxableBase?: number | string | null;
  expenseAccountId: string;
  taxableBase: number | string;
  igvAmount?: number | string;
  detraccionAmount?: number | string;
  notes?: string | null;
}

export interface CreatePurchaseCreditNoteInput {
  supplierId: string;
  invoiceId?: string | null;
  periodId: string;
  series: string;
  number: string;
  issueDate: string;
  taxableBase: number | string;
  igvAmount?: number | string;
  reason?: string | null;
}

export interface CreatePurchaseDebitNoteInput {
  supplierId: string;
  invoiceId?: string | null;
  periodId: string;
  series: string;
  number: string;
  issueDate: string;
  taxableBase: number | string;
  igvAmount?: number | string;
  reason?: string | null;
}

export interface CreatePurchasePaymentInput {
  invoiceId: string;
  periodId: string;
  amount: number | string;
  paymentDate: string;
  description: string;
  sourceType: 'CASH' | 'BANK';
  cashBoxId?: string | null;
  bankAccountId?: string | null;
}

export interface ContabilidadPurchasesRepository {
  listSuppliers(applicationId: string, filters: ListSuppliersFilters): Promise<ContabilidadSupplierDto[]>;
  findSupplierById(applicationId: string, id: string): Promise<ContabilidadSupplierDto | null>;
  createSupplier(applicationId: string, input: CreateSupplierInput): Promise<ContabilidadSupplierDto>;
  updateSupplier(applicationId: string, id: string, input: UpdateSupplierInput): Promise<ContabilidadSupplierDto>;

  listInvoices(
    applicationId: string,
    filters: ListPurchaseInvoicesFilters,
  ): Promise<ContabilidadPurchaseInvoiceDto[]>;
  findInvoiceById(applicationId: string, id: string): Promise<ContabilidadPurchaseInvoiceDto | null>;
  createInvoiceWithJournal(
    applicationId: string,
    input: CreatePurchaseInvoiceInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseInvoiceDto>;
  cancelInvoice(applicationId: string, id: string): Promise<ContabilidadPurchaseInvoiceDto>;

  listCreditNotes(
    applicationId: string,
    filters: ListPurchaseCreditNotesFilters,
  ): Promise<ContabilidadPurchaseCreditNoteDto[]>;
  createCreditNoteWithJournal(
    applicationId: string,
    input: CreatePurchaseCreditNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseCreditNoteDto>;

  listDebitNotes(
    applicationId: string,
    filters: ListPurchaseDebitNotesFilters,
  ): Promise<ContabilidadPurchaseDebitNoteDto[]>;
  createDebitNoteWithJournal(
    applicationId: string,
    input: CreatePurchaseDebitNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseDebitNoteDto>;

  listPayments(
    applicationId: string,
    filters: ListPurchasePaymentsFilters,
  ): Promise<ContabilidadPurchasePaymentDto[]>;
  createPaymentWithTreasury(
    applicationId: string,
    input: CreatePurchasePaymentInput,
    payableAccountId: string,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchasePaymentDto>;
}
