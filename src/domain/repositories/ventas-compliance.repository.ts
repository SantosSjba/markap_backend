export interface SaleComplianceChecklistUpsertData {
  applicationId: string;
  propertyId: string;
  buyerClientId: string;
  titleStudyChecked?: boolean;
  criChecked?: boolean;
  noLiensChecked?: boolean;
  municipalTaxClearanceChecked?: boolean;
  minutaSigned?: boolean;
  publicDeedSigned?: boolean;
  notarialPartSubmitted?: boolean;
  sunarpStatus?: string;
  sunarpSubmittedAt?: Date | null;
  sunarpObservedAt?: Date | null;
  sunarpRegisteredAt?: Date | null;
  sunarpObservationNotes?: string | null;
  alcabalaApplicable?: boolean;
  alcabalaAmount?: number | null;
  alcabalaPaidAt?: Date | null;
  rent2Applicable?: boolean;
  rent2Amount?: number | null;
  rent2PaidAt?: Date | null;
  bankedPaymentRequired?: boolean;
  bankedPaymentVerified?: boolean;
  paymentMethod?: string | null;
  bankOperationNumber?: string | null;
  bankName?: string | null;
  bankAccountHolder?: string | null;
  paymentEvidencePath?: string | null;
  fundsSourceDeclared?: boolean;
  beneficialOwnerDeclared?: boolean;
  kycRiskLevel?: string;
  complianceNotes?: string | null;
  nextActionAt?: Date | null;
}

export interface SaleComplianceDocumentCreateData {
  applicationId: string;
  propertyId: string;
  buyerClientId: string;
  docType: string;
  filePath: string;
  issuedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  notes?: string | null;
}

export interface SaleClosingReadinessResult {
  ok: boolean;
  missing: string[];
  checklist: unknown | null;
}

export interface CompliancePendingBoardFilters {
  limit?: number;
  offset?: number;
  sunarpStatus?: string;
  onlyOverdue?: boolean;
}

export const VENTAS_COMPLIANCE_REPOSITORY = Symbol('VentasComplianceRepository');

export interface VentasComplianceRepository {
  getChecklist(applicationId: string, propertyId: string, buyerClientId: string): Promise<unknown | null>;
  upsertChecklist(data: SaleComplianceChecklistUpsertData): Promise<unknown>;
  addDocument(data: SaleComplianceDocumentCreateData): Promise<unknown>;
  listDocuments(applicationId: string, propertyId: string, buyerClientId: string): Promise<unknown[]>;
  getClosingReadiness(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<SaleClosingReadinessResult>;
  listChecklistRows(applicationId: string, filters: CompliancePendingBoardFilters): Promise<unknown[]>;
  markAlertSent(checklistId: string): Promise<void>;
}
