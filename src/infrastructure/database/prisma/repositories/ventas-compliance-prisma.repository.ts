import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  VentasComplianceRepository,
  CompliancePendingBoardFilters,
  SaleClosingReadinessResult,
  SaleComplianceChecklistUpsertData,
  SaleComplianceDocumentCreateData,
} from '@domain/repositories/ventas-compliance.repository';

@Injectable()
export class VentasCompliancePrismaRepository implements VentasComplianceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureChecklist(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<{ id: string }> {
    return this.prisma.saleComplianceChecklist.upsert({
      where: {
        applicationId_propertyId_buyerClientId: {
          applicationId,
          propertyId,
          buyerClientId,
        },
      },
      create: {
        applicationId,
        propertyId,
        buyerClientId,
      },
      update: {},
      select: { id: true },
    });
  }

  async getChecklist(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<unknown | null> {
    return this.prisma.saleComplianceChecklist.findUnique({
      where: {
        applicationId_propertyId_buyerClientId: {
          applicationId,
          propertyId,
          buyerClientId,
        },
      },
    });
  }

  async upsertChecklist(data: SaleComplianceChecklistUpsertData): Promise<unknown> {
    return this.prisma.saleComplianceChecklist.upsert({
      where: {
        applicationId_propertyId_buyerClientId: {
          applicationId: data.applicationId,
          propertyId: data.propertyId,
          buyerClientId: data.buyerClientId,
        },
      },
      create: {
        applicationId: data.applicationId,
        propertyId: data.propertyId,
        buyerClientId: data.buyerClientId,
        ...(data.titleStudyChecked !== undefined && { titleStudyChecked: data.titleStudyChecked }),
        ...(data.criChecked !== undefined && { criChecked: data.criChecked }),
        ...(data.noLiensChecked !== undefined && { noLiensChecked: data.noLiensChecked }),
        ...(data.municipalTaxClearanceChecked !== undefined && {
          municipalTaxClearanceChecked: data.municipalTaxClearanceChecked,
        }),
        ...(data.minutaSigned !== undefined && { minutaSigned: data.minutaSigned }),
        ...(data.publicDeedSigned !== undefined && { publicDeedSigned: data.publicDeedSigned }),
        ...(data.notarialPartSubmitted !== undefined && {
          notarialPartSubmitted: data.notarialPartSubmitted,
        }),
        ...(data.sunarpStatus !== undefined && { sunarpStatus: data.sunarpStatus }),
        ...(data.sunarpSubmittedAt !== undefined && { sunarpSubmittedAt: data.sunarpSubmittedAt }),
        ...(data.sunarpObservedAt !== undefined && { sunarpObservedAt: data.sunarpObservedAt }),
        ...(data.sunarpRegisteredAt !== undefined && { sunarpRegisteredAt: data.sunarpRegisteredAt }),
        ...(data.sunarpObservationNotes !== undefined && {
          sunarpObservationNotes: data.sunarpObservationNotes,
        }),
        ...(data.alcabalaApplicable !== undefined && { alcabalaApplicable: data.alcabalaApplicable }),
        ...(data.alcabalaAmount !== undefined && { alcabalaAmount: data.alcabalaAmount }),
        ...(data.alcabalaPaidAt !== undefined && { alcabalaPaidAt: data.alcabalaPaidAt }),
        ...(data.rent2Applicable !== undefined && { rent2Applicable: data.rent2Applicable }),
        ...(data.rent2Amount !== undefined && { rent2Amount: data.rent2Amount }),
        ...(data.rent2PaidAt !== undefined && { rent2PaidAt: data.rent2PaidAt }),
        ...(data.bankedPaymentRequired !== undefined && {
          bankedPaymentRequired: data.bankedPaymentRequired,
        }),
        ...(data.bankedPaymentVerified !== undefined && {
          bankedPaymentVerified: data.bankedPaymentVerified,
        }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.bankOperationNumber !== undefined && {
          bankOperationNumber: data.bankOperationNumber,
        }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankAccountHolder !== undefined && { bankAccountHolder: data.bankAccountHolder }),
        ...(data.paymentEvidencePath !== undefined && { paymentEvidencePath: data.paymentEvidencePath }),
        ...(data.fundsSourceDeclared !== undefined && {
          fundsSourceDeclared: data.fundsSourceDeclared,
        }),
        ...(data.beneficialOwnerDeclared !== undefined && {
          beneficialOwnerDeclared: data.beneficialOwnerDeclared,
        }),
        ...(data.kycRiskLevel !== undefined && { kycRiskLevel: data.kycRiskLevel }),
        ...(data.complianceNotes !== undefined && { complianceNotes: data.complianceNotes }),
        ...(data.nextActionAt !== undefined && { nextActionAt: data.nextActionAt }),
      },
      update: {
        ...(data.titleStudyChecked !== undefined && { titleStudyChecked: data.titleStudyChecked }),
        ...(data.criChecked !== undefined && { criChecked: data.criChecked }),
        ...(data.noLiensChecked !== undefined && { noLiensChecked: data.noLiensChecked }),
        ...(data.municipalTaxClearanceChecked !== undefined && {
          municipalTaxClearanceChecked: data.municipalTaxClearanceChecked,
        }),
        ...(data.minutaSigned !== undefined && { minutaSigned: data.minutaSigned }),
        ...(data.publicDeedSigned !== undefined && { publicDeedSigned: data.publicDeedSigned }),
        ...(data.notarialPartSubmitted !== undefined && {
          notarialPartSubmitted: data.notarialPartSubmitted,
        }),
        ...(data.sunarpStatus !== undefined && { sunarpStatus: data.sunarpStatus }),
        ...(data.sunarpSubmittedAt !== undefined && { sunarpSubmittedAt: data.sunarpSubmittedAt }),
        ...(data.sunarpObservedAt !== undefined && { sunarpObservedAt: data.sunarpObservedAt }),
        ...(data.sunarpRegisteredAt !== undefined && { sunarpRegisteredAt: data.sunarpRegisteredAt }),
        ...(data.sunarpObservationNotes !== undefined && {
          sunarpObservationNotes: data.sunarpObservationNotes,
        }),
        ...(data.alcabalaApplicable !== undefined && { alcabalaApplicable: data.alcabalaApplicable }),
        ...(data.alcabalaAmount !== undefined && { alcabalaAmount: data.alcabalaAmount }),
        ...(data.alcabalaPaidAt !== undefined && { alcabalaPaidAt: data.alcabalaPaidAt }),
        ...(data.rent2Applicable !== undefined && { rent2Applicable: data.rent2Applicable }),
        ...(data.rent2Amount !== undefined && { rent2Amount: data.rent2Amount }),
        ...(data.rent2PaidAt !== undefined && { rent2PaidAt: data.rent2PaidAt }),
        ...(data.bankedPaymentRequired !== undefined && {
          bankedPaymentRequired: data.bankedPaymentRequired,
        }),
        ...(data.bankedPaymentVerified !== undefined && {
          bankedPaymentVerified: data.bankedPaymentVerified,
        }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.bankOperationNumber !== undefined && {
          bankOperationNumber: data.bankOperationNumber,
        }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankAccountHolder !== undefined && { bankAccountHolder: data.bankAccountHolder }),
        ...(data.paymentEvidencePath !== undefined && { paymentEvidencePath: data.paymentEvidencePath }),
        ...(data.fundsSourceDeclared !== undefined && {
          fundsSourceDeclared: data.fundsSourceDeclared,
        }),
        ...(data.beneficialOwnerDeclared !== undefined && {
          beneficialOwnerDeclared: data.beneficialOwnerDeclared,
        }),
        ...(data.kycRiskLevel !== undefined && { kycRiskLevel: data.kycRiskLevel }),
        ...(data.complianceNotes !== undefined && { complianceNotes: data.complianceNotes }),
        ...(data.nextActionAt !== undefined && { nextActionAt: data.nextActionAt }),
      },
    });
  }

  async addDocument(data: SaleComplianceDocumentCreateData): Promise<unknown> {
    const checklist = await this.ensureChecklist(
      data.applicationId,
      data.propertyId,
      data.buyerClientId,
    );
    return this.prisma.saleComplianceDocument.create({
      data: {
        checklistId: checklist.id,
        docType: data.docType,
        filePath: data.filePath,
        issuedAt: data.issuedAt ?? null,
        verifiedAt: data.verifiedAt ?? null,
        verifiedBy: data.verifiedBy ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async listDocuments(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<unknown[]> {
    const checklist = await this.getChecklist(applicationId, propertyId, buyerClientId) as
      | { id: string }
      | null;
    if (!checklist) return [];
    const rows = await this.prisma.saleComplianceDocument.findMany({
      where: { checklistId: checklist.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows as unknown[];
  }

  async getClosingReadiness(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<SaleClosingReadinessResult> {
    const checklist = await this.getChecklist(applicationId, propertyId, buyerClientId) as
      | Record<string, unknown>
      | null;
    if (!checklist) {
      return {
        ok: false,
        checklist: null,
        missing: ['Checklist legal no registrado para esta operación.'],
      };
    }

    const missing: string[] = [];
    if (!checklist.titleStudyChecked) missing.push('Falta estudio de títulos');
    if (!checklist.criChecked) missing.push('Falta verificación CRI');
    if (!checklist.noLiensChecked) missing.push('Falta validación de cargas/gravámenes');
    if (!checklist.municipalTaxClearanceChecked) missing.push('Falta constancia municipal');
    if (!checklist.minutaSigned) missing.push('Falta minuta firmada');
    if (!checklist.publicDeedSigned) missing.push('Falta escritura pública firmada');

    if (checklist.bankedPaymentRequired) {
      if (!checklist.bankedPaymentVerified) {
        missing.push('Falta validación de bancarización');
      }
      if (!checklist.bankOperationNumber) {
        missing.push('Falta número de operación bancaria');
      }
    }

    if (checklist.alcabalaApplicable && !checklist.alcabalaPaidAt) {
      missing.push('Falta pago de alcabala');
    }
    if (checklist.rent2Applicable && !checklist.rent2PaidAt) {
      missing.push('Falta pago de renta de 2da categoría');
    }

    if (!checklist.fundsSourceDeclared) {
      missing.push('Falta declaración de origen de fondos');
    }
    if (!checklist.beneficialOwnerDeclared) {
      missing.push('Falta declaración de beneficiario final');
    }
    if (String(checklist.kycRiskLevel ?? '').toUpperCase() === 'HIGH') {
      missing.push('Riesgo KYC en nivel HIGH');
    }

    return {
      ok: missing.length === 0,
      missing,
      checklist,
    };
  }

  async listChecklistRows(
    applicationId: string,
    filters: CompliancePendingBoardFilters,
  ): Promise<unknown[]> {
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
    const offset = Math.max(0, filters.offset ?? 0);
    const where: Record<string, unknown> = { applicationId };
    if (filters.sunarpStatus?.trim()) {
      where.sunarpStatus = filters.sunarpStatus.trim().toUpperCase();
    }
    if (filters.onlyOverdue) {
      where.nextActionAt = { lt: new Date() };
    }

    const rows = await this.prisma.saleComplianceChecklist.findMany({
      where,
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ nextActionAt: 'asc' }, { updatedAt: 'asc' }],
      take: limit,
      skip: offset,
    });
    return rows as unknown[];
  }

  async markAlertSent(checklistId: string): Promise<void> {
    await this.prisma.saleComplianceChecklist.update({
      where: { id: checklistId },
      data: { lastAlertSentAt: new Date() },
    });
  }
}
