import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class DispatchComplianceAlertsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    dryRun: optionalValue(booleanInput),
    daysWithoutAlert: optionalValue(numericInput),
    maxItems: optionalValue(numericInput),
  });

  dryRun?: boolean;

  daysWithoutAlert?: number;

  maxItems?: number;
}

export class UploadComplianceDocumentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    docType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «docType» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «docType» es obligatorio.' }),
    ),
    issuedAt: optionalValue(
      z.string({ error: 'El campo «issuedAt» debe ser un texto.' }),
    ),
    verifiedAt: optionalValue(
      z.string({ error: 'El campo «verifiedAt» debe ser un texto.' }),
    ),
    verifiedBy: optionalValue(
      z.string({ error: 'El campo «verifiedBy» debe ser un texto.' }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  propertyId!: string;

  buyerClientId!: string;

  docType!: string;

  issuedAt?: string | null;

  verifiedAt?: string | null;

  verifiedBy?: string | null;

  notes?: string | null;
}

export class UploadPaymentEvidenceDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
  });

  propertyId!: string;

  buyerClientId!: string;
}

export class CreateComplianceDocumentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    docType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «docType» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «docType» es obligatorio.' }),
    ),
    filePath: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «filePath» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «filePath» es obligatorio.' }),
    ),
    issuedAt: optionalValue(
      z.string({ error: 'El campo «issuedAt» debe ser un texto.' }),
    ),
    verifiedAt: optionalValue(
      z.string({ error: 'El campo «verifiedAt» debe ser un texto.' }),
    ),
    verifiedBy: optionalValue(
      z.string({ error: 'El campo «verifiedBy» debe ser un texto.' }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  propertyId!: string;

  buyerClientId!: string;

  docType!: string;

  filePath!: string;

  issuedAt?: string | null;

  verifiedAt?: string | null;

  verifiedBy?: string | null;

  notes?: string | null;
}

export class UpsertComplianceChecklistDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    titleStudyChecked: optionalValue(booleanInput),
    criChecked: optionalValue(booleanInput),
    noLiensChecked: optionalValue(booleanInput),
    municipalTaxClearanceChecked: optionalValue(booleanInput),
    minutaSigned: optionalValue(booleanInput),
    publicDeedSigned: optionalValue(booleanInput),
    notarialPartSubmitted: optionalValue(booleanInput),
    sunarpStatus: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «sunarpStatus» debe ser un texto.' }),
      ),
    ),
    sunarpSubmittedAt: optionalValue(
      z.string({ error: 'El campo «sunarpSubmittedAt» debe ser un texto.' }),
    ),
    sunarpObservedAt: optionalValue(
      z.string({ error: 'El campo «sunarpObservedAt» debe ser un texto.' }),
    ),
    sunarpRegisteredAt: optionalValue(
      z.string({ error: 'El campo «sunarpRegisteredAt» debe ser un texto.' }),
    ),
    sunarpObservationNotes: optionalValue(
      z.string({
        error: 'El campo «sunarpObservationNotes» debe ser un texto.',
      }),
    ),
    alcabalaApplicable: optionalValue(booleanInput),
    alcabalaAmount: optionalValue(numericInput),
    alcabalaCurrency: optionalValue(
      z.string({
        error: 'El campo «moneda de la alcabala» debe ser un texto.',
      }),
    ),
    alcabalaPaidAt: optionalValue(
      z.string({ error: 'El campo «alcabalaPaidAt» debe ser un texto.' }),
    ),
    rent2Applicable: optionalValue(booleanInput),
    rent2Amount: optionalValue(numericInput),
    rent2Currency: optionalValue(
      z.string({
        error: 'El campo «moneda de la renta 2da» debe ser un texto.',
      }),
    ),
    rent2PaidAt: optionalValue(
      z.string({ error: 'El campo «rent2PaidAt» debe ser un texto.' }),
    ),
    bankedPaymentRequired: optionalValue(booleanInput),
    bankedPaymentVerified: optionalValue(booleanInput),
    paymentMethod: optionalValue(
      z.string({ error: 'El campo «método de pago» debe ser un texto.' }),
    ),
    paymentAmount: optionalValue(numericInput),
    paymentCurrency: optionalValue(
      z.string({ error: 'El campo «moneda del pago» debe ser un texto.' }),
    ),
    bankOperationNumber: optionalValue(
      z.string({ error: 'El campo «bankOperationNumber» debe ser un texto.' }),
    ),
    bankName: optionalValue(
      z.string({ error: 'El campo «banco» debe ser un texto.' }),
    ),
    bankAccountHolder: optionalValue(
      z.string({ error: 'El campo «bankAccountHolder» debe ser un texto.' }),
    ),
    paymentEvidencePath: optionalValue(
      z.string({ error: 'El campo «paymentEvidencePath» debe ser un texto.' }),
    ),
    paymentEvidenceArchivoId: optionalValue(
      z.string({
        error: 'El campo «paymentEvidenceArchivoId» debe ser un texto.',
      }),
    ),
    fundsSourceDeclared: optionalValue(booleanInput),
    beneficialOwnerDeclared: optionalValue(booleanInput),
    kycRiskLevel: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «kycRiskLevel» debe ser un texto.' }),
      ),
    ),
    complianceNotes: optionalValue(
      z.string({ error: 'El campo «complianceNotes» debe ser un texto.' }),
    ),
    nextActionAt: optionalValue(
      z.string({ error: 'El campo «nextActionAt» debe ser un texto.' }),
    ),
  });

  propertyId!: string;

  buyerClientId!: string;

  titleStudyChecked?: boolean;

  criChecked?: boolean;

  noLiensChecked?: boolean;

  municipalTaxClearanceChecked?: boolean;

  minutaSigned?: boolean;

  publicDeedSigned?: boolean;

  notarialPartSubmitted?: boolean;

  sunarpStatus?: string;

  sunarpSubmittedAt?: string | null;

  sunarpObservedAt?: string | null;

  sunarpRegisteredAt?: string | null;

  sunarpObservationNotes?: string | null;

  alcabalaApplicable?: boolean;

  alcabalaAmount?: number | null;

  alcabalaCurrency?: string | null;

  alcabalaPaidAt?: string | null;

  rent2Applicable?: boolean;

  rent2Amount?: number | null;

  rent2Currency?: string | null;

  rent2PaidAt?: string | null;

  bankedPaymentRequired?: boolean;

  bankedPaymentVerified?: boolean;

  paymentMethod?: string | null;

  paymentAmount?: number | null;

  paymentCurrency?: string | null;

  bankOperationNumber?: string | null;

  bankName?: string | null;

  bankAccountHolder?: string | null;

  paymentEvidencePath?: string | null;

  paymentEvidenceArchivoId?: string | null;

  fundsSourceDeclared?: boolean;

  beneficialOwnerDeclared?: boolean;

  kycRiskLevel?: string;

  complianceNotes?: string | null;

  nextActionAt?: string | null;
}
