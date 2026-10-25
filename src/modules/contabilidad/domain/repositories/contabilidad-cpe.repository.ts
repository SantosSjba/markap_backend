export const CONTABILIDAD_CPE_REPOSITORY = Symbol('ContabilidadCpeRepository');

export interface ContabilidadCpeProviderConfigDto {
  id: string;
  legalEntityId: string;
  legalEntityCode: string;
  legalEntityRuc: string;
  providerCode: string;
  apiBaseUrl: string | null;
  apiTokenHint: string | null;
  hasApiToken: boolean;
  certificateHint: string | null;
  useSandbox: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertCpeProviderConfigInput {
  providerCode: string;
  apiBaseUrl?: string | null;
  apiToken?: string | null;
  certificateHint?: string | null;
  useSandbox?: boolean;
  isActive?: boolean;
}

export interface ContabilidadCpeEmitResultDto {
  logId: string;
  sourceType: string;
  sourceId: string;
  documentRef: string;
  sunatStatus: string;
  sunatResponseCode: string | null;
  sunatResponseMessage: string | null;
  xmlHash: string | null;
  cdrReference: string | null;
  electronicStatus: string;
}

export interface ContabilidadCpeDocumentArtifactDto {
  logId: string;
  documentRef: string;
  contentType: string;
  filename: string;
  content: string;
}

export interface CpeSalesInvoiceEmitContext {
  applicationId: string;
  legalEntityId: string;
  invoiceId: string;
  periodId: string;
  documentType: string;
  series: string;
  number: string;
  fullNumber: string;
  issueDate: string;
  taxAffectation: string;
  currencyCode: string;
  taxableBase: string;
  igvAmount: string;
  totalAmount: string;
  customerRuc: string;
  customerName: string;
  customerAddress: string | null;
  issuerRuc: string;
  issuerLegalName: string;
  issuerTradeName: string | null;
  issuerAddress: string;
  existingLogId: string | null;
  currentElectronicStatus: string;
}

export interface ContabilidadCpeRepository {
  getProviderConfig(
    applicationId: string,
    legalEntityId: string,
  ): Promise<ContabilidadCpeProviderConfigDto | null>;
  upsertProviderConfig(
    applicationId: string,
    legalEntityId: string,
    input: UpsertCpeProviderConfigInput,
  ): Promise<ContabilidadCpeProviderConfigDto>;
  getSalesInvoiceEmitContext(
    applicationId: string,
    invoiceId: string,
  ): Promise<CpeSalesInvoiceEmitContext | null>;
  saveEmitResult(input: {
    applicationId: string;
    legalEntityId: string;
    periodId: string;
    sourceType: string;
    sourceId: string;
    documentKind: string;
    documentRef: string;
    sunatStatus: string;
    sunatResponseCode: string | null;
    sunatResponseMessage: string | null;
    xmlHash: string;
    xmlContent: string;
    cdrReference: string | null;
    cdrContent: string | null;
    existingLogId: string | null;
    sentAt: Date | null;
    acceptedAt: Date | null;
  }): Promise<ContabilidadCpeEmitResultDto>;
  getDocumentArtifact(
    applicationId: string,
    logId: string,
    kind: 'xml' | 'cdr',
  ): Promise<ContabilidadCpeDocumentArtifactDto | null>;
}
