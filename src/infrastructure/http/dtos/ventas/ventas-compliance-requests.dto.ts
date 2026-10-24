import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import {
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';

export class DispatchComplianceAlertsDto {
  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  dryRun?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  daysWithoutAlert?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  maxItems?: number;
}

export class UploadComplianceDocumentDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @IsString()
  @IsNotEmpty()
  docType!: string;

  @OptionalValue()
  @IsString()
  issuedAt?: string | null;

  @OptionalValue()
  @IsString()
  verifiedAt?: string | null;

  @OptionalValue()
  @IsString()
  verifiedBy?: string | null;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UploadPaymentEvidenceDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;
}

export class CreateComplianceDocumentDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @IsString()
  @IsNotEmpty()
  docType!: string;

  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @OptionalValue()
  @IsString()
  issuedAt?: string | null;

  @OptionalValue()
  @IsString()
  verifiedAt?: string | null;

  @OptionalValue()
  @IsString()
  verifiedBy?: string | null;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UpsertComplianceChecklistDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  titleStudyChecked?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  criChecked?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  noLiensChecked?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  municipalTaxClearanceChecked?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  minutaSigned?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  publicDeedSigned?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  notarialPartSubmitted?: boolean;

  @OptionalValue()
  @IsString()
  sunarpStatus?: string;

  @OptionalValue()
  @IsString()
  sunarpSubmittedAt?: string | null;

  @OptionalValue()
  @IsString()
  sunarpObservedAt?: string | null;

  @OptionalValue()
  @IsString()
  sunarpRegisteredAt?: string | null;

  @OptionalValue()
  @IsString()
  sunarpObservationNotes?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  alcabalaApplicable?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  alcabalaAmount?: number | null;

  @OptionalValue()
  @IsString()
  alcabalaPaidAt?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  rent2Applicable?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  rent2Amount?: number | null;

  @OptionalValue()
  @IsString()
  rent2PaidAt?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  bankedPaymentRequired?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  bankedPaymentVerified?: boolean;

  @OptionalValue()
  @IsString()
  paymentMethod?: string | null;

  @OptionalValue()
  @IsString()
  bankOperationNumber?: string | null;

  @OptionalValue()
  @IsString()
  bankName?: string | null;

  @OptionalValue()
  @IsString()
  bankAccountHolder?: string | null;

  @OptionalValue()
  @IsString()
  paymentEvidencePath?: string | null;

  @OptionalValue()
  @IsString()
  paymentEvidenceArchivoId?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  fundsSourceDeclared?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  beneficialOwnerDeclared?: boolean;

  @OptionalValue()
  @IsString()
  kycRiskLevel?: string;

  @OptionalValue()
  @IsString()
  complianceNotes?: string | null;

  @OptionalValue()
  @IsString()
  nextActionAt?: string | null;
}
