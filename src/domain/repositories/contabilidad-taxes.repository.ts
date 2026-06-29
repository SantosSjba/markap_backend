export const CONTABILIDAD_TAXES_REPOSITORY = Symbol('ContabilidadTaxesRepository');

export interface ContabilidadIgvSummaryDto {
  periodId: string;
  year: number;
  month: number;
  igvPercent: number;
  purchaseCreditIgv: string;
  purchaseCreditNoteIgv: string;
  salesDebitIgv: string;
  salesCreditNoteIgv: string;
  retentionsIgv: string;
  perceptionsIgv: string;
  netDebitIgv: string;
  netCreditIgv: string;
  balanceToPay: string;
  balanceInFavor: string;
}

export interface ContabilidadPdt621ExportDto {
  periodId: string;
  year: number;
  month: number;
  ruc: string;
  legalName: string;
  igvSummary: ContabilidadIgvSummaryDto;
  detraccionesTotal: string;
  retencionesTotal: string;
  percepcionesTotal: string;
  generatedAt: string;
}

export interface ContabilidadDetraccionRateDto {
  id: string;
  sunatCode: string;
  description: string;
  ratePercent: string;
  minAmount: string;
  isActive: boolean;
}

export interface ContabilidadDetraccionDto {
  id: string;
  periodId: string;
  purchaseInvoiceId: string | null;
  invoiceFullNumber: string | null;
  rateId: string | null;
  rateDescription: string | null;
  supplierRuc: string;
  supplierName: string;
  certificateNumber: string;
  operationDate: string;
  baseAmount: string;
  ratePercent: string;
  amount: string;
  status: string;
  paidAt: string | null;
  treasuryMovementId: string | null;
  journalEntryId: string | null;
  createdAt: string;
}

export interface ContabilidadRetentionDto {
  id: string;
  periodId: string;
  retentionType: string;
  counterpartyRuc: string;
  counterpartyName: string;
  documentType: string | null;
  documentSeries: string | null;
  documentNumber: string | null;
  fullDocument: string | null;
  issueDate: string;
  taxableBase: string;
  ratePercent: string;
  amount: string;
  purchaseInvoiceId: string | null;
  journalEntryId: string | null;
  status: string;
  createdAt: string;
}

export interface ContabilidadPerceptionDto {
  id: string;
  periodId: string;
  perceptionType: string;
  customerRuc: string;
  customerName: string;
  salesInvoiceId: string | null;
  invoiceFullNumber: string | null;
  issueDate: string;
  taxableBase: string;
  ratePercent: string;
  amount: string;
  treasuryMovementId: string | null;
  journalEntryId: string | null;
  status: string;
  createdAt: string;
}

export interface CreateDetraccionInput {
  periodId: string;
  purchaseInvoiceId?: string | null;
  rateId?: string | null;
  supplierRuc: string;
  supplierName: string;
  certificateNumber: string;
  operationDate: string;
  baseAmount: number | string;
  ratePercent?: number | string;
  amount?: number | string;
}

export interface PayDetraccionInput {
  paymentDate: string;
  description: string;
  sourceType: 'CASH' | 'BANK';
  cashBoxId?: string | null;
  bankAccountId?: string | null;
}

export interface CreateRetentionInput {
  periodId: string;
  retentionType: string;
  counterpartyRuc: string;
  counterpartyName: string;
  documentType?: string | null;
  documentSeries?: string | null;
  documentNumber?: string | null;
  issueDate: string;
  taxableBase: number | string;
  ratePercent?: number | string;
  amount?: number | string;
  purchaseInvoiceId?: string | null;
}

export interface CreatePerceptionInput {
  periodId: string;
  perceptionType: string;
  customerRuc: string;
  customerName: string;
  salesInvoiceId?: string | null;
  issueDate: string;
  taxableBase: number | string;
  ratePercent?: number | string;
  amount?: number | string;
  sourceType: 'CASH' | 'BANK';
  cashBoxId?: string | null;
  bankAccountId?: string | null;
  description: string;
}

export interface ContabilidadTaxesRepository {
  ensureDefaults(applicationId: string): Promise<void>;

  getIgvSummary(applicationId: string, periodId: string, igvPercent: number): Promise<ContabilidadIgvSummaryDto>;
  getPdt621Export(
    applicationId: string,
    periodId: string,
    company: { ruc: string; legalName: string },
    igvPercent: number,
  ): Promise<ContabilidadPdt621ExportDto>;

  listDetraccionRates(applicationId: string): Promise<ContabilidadDetraccionRateDto[]>;
  listDetracciones(
    applicationId: string,
    filters: { periodId?: string; status?: string },
  ): Promise<ContabilidadDetraccionDto[]>;
  createDetraccion(
    applicationId: string,
    input: CreateDetraccionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadDetraccionDto>;
  payDetraccion(
    applicationId: string,
    id: string,
    input: PayDetraccionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadDetraccionDto>;

  listRetentions(
    applicationId: string,
    filters: { periodId?: string; retentionType?: string },
  ): Promise<ContabilidadRetentionDto[]>;
  createRetention(
    applicationId: string,
    input: CreateRetentionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadRetentionDto>;

  listPerceptions(
    applicationId: string,
    filters: { periodId?: string },
  ): Promise<ContabilidadPerceptionDto[]>;
  createPerception(
    applicationId: string,
    input: CreatePerceptionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadPerceptionDto>;
}
