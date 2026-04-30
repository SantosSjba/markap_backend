import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ClientRepository } from '@domain/repositories/client.repository';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import type { VentasComplianceRepository } from '@domain/repositories/ventas-compliance.repository';
import {
  APPLICATION_REPOSITORY,
  CLIENT_REPOSITORY,
  PROPERTY_REPOSITORY,
  VENTAS_COMPLIANCE_REPOSITORY,
} from '@common/constants/injection-tokens';
import { EntityNotFoundException } from '@domain/exceptions';
import { NotificationsService } from './notifications.service';

const VENTAS_SLUG = 'ventas';
const ALLOWED_SUNARP_STATUS = new Set(['PENDING', 'SUBMITTED', 'OBSERVED', 'REGISTERED']);
const ALLOWED_KYC_LEVEL = new Set(['PENDING', 'LOW', 'MEDIUM', 'HIGH']);

function assertVentasApp(slug: string | undefined | null): void {
  if (slug?.trim() !== VENTAS_SLUG) {
    throw new BadRequestException(
      'Estas operaciones solo aplican a la aplicación Ventas (applicationSlug=ventas).',
    );
  }
}

function parseDateOrNull(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Fecha inválida.');
  return d;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class VentasComplianceOperationsService {
  constructor(
    @Inject(VENTAS_COMPLIANCE_REPOSITORY)
    private readonly compliance: VentasComplianceRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveVentasApplicationId(applicationSlug?: string): Promise<string> {
    assertVentasApp(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  private async ensureOperationScope(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<void> {
    const [property, buyer] = await Promise.all([
      this.propertyRepository.findById(propertyId),
      this.clientRepository.findById(buyerClientId),
    ]);

    if (!property || property.applicationId !== applicationId) {
      throw new EntityNotFoundException('Property', propertyId);
    }
    if (!buyer || buyer.applicationId !== applicationId) {
      throw new EntityNotFoundException('Client', buyerClientId);
    }
    if (buyer.clientType !== 'BUYER') {
      throw new BadRequestException(
        'El checklist legal de ventas requiere un cliente comprador / lead.',
      );
    }
  }

  async getChecklist(
    applicationSlug: string | undefined,
    propertyId: string,
    buyerClientId: string,
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    await this.ensureOperationScope(applicationId, propertyId, buyerClientId);
    return this.compliance.getChecklist(applicationId, propertyId, buyerClientId);
  }

  async upsertChecklist(
    applicationSlug: string | undefined,
    body: {
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
      sunarpSubmittedAt?: string | null;
      sunarpObservedAt?: string | null;
      sunarpRegisteredAt?: string | null;
      sunarpObservationNotes?: string | null;
      alcabalaApplicable?: boolean;
      alcabalaAmount?: number | null;
      alcabalaPaidAt?: string | null;
      rent2Applicable?: boolean;
      rent2Amount?: number | null;
      rent2PaidAt?: string | null;
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
      nextActionAt?: string | null;
    },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    await this.ensureOperationScope(applicationId, body.propertyId, body.buyerClientId);

    const sunarpStatus = body.sunarpStatus?.trim().toUpperCase();
    if (sunarpStatus && !ALLOWED_SUNARP_STATUS.has(sunarpStatus)) {
      throw new BadRequestException('sunarpStatus inválido. Use: PENDING, SUBMITTED, OBSERVED, REGISTERED.');
    }

    const kycRiskLevel = body.kycRiskLevel?.trim().toUpperCase();
    if (kycRiskLevel && !ALLOWED_KYC_LEVEL.has(kycRiskLevel)) {
      throw new BadRequestException('kycRiskLevel inválido. Use: PENDING, LOW, MEDIUM, HIGH.');
    }

    const sunarpSubmittedAt = parseDateOrNull(body.sunarpSubmittedAt);
    const sunarpObservedAt = parseDateOrNull(body.sunarpObservedAt);
    const sunarpRegisteredAt = parseDateOrNull(body.sunarpRegisteredAt);

    if (sunarpStatus === 'SUBMITTED' && !sunarpSubmittedAt) {
      throw new BadRequestException('Para estado SUBMITTED registre sunarpSubmittedAt.');
    }
    if (sunarpStatus === 'OBSERVED' && !sunarpObservedAt) {
      throw new BadRequestException('Para estado OBSERVED registre sunarpObservedAt.');
    }
    if (sunarpStatus === 'OBSERVED' && !body.sunarpObservationNotes?.trim()) {
      throw new BadRequestException('Para estado OBSERVED registre sunarpObservationNotes.');
    }
    if (sunarpStatus === 'REGISTERED' && !sunarpRegisteredAt) {
      throw new BadRequestException('Para estado REGISTERED registre sunarpRegisteredAt.');
    }

    return this.compliance.upsertChecklist({
      applicationId,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      titleStudyChecked: body.titleStudyChecked,
      criChecked: body.criChecked,
      noLiensChecked: body.noLiensChecked,
      municipalTaxClearanceChecked: body.municipalTaxClearanceChecked,
      minutaSigned: body.minutaSigned,
      publicDeedSigned: body.publicDeedSigned,
      notarialPartSubmitted: body.notarialPartSubmitted,
      sunarpStatus,
      sunarpSubmittedAt,
      sunarpObservedAt,
      sunarpRegisteredAt,
      sunarpObservationNotes: body.sunarpObservationNotes ?? null,
      alcabalaApplicable: body.alcabalaApplicable,
      alcabalaAmount: body.alcabalaAmount,
      alcabalaPaidAt: parseDateOrNull(body.alcabalaPaidAt),
      rent2Applicable: body.rent2Applicable,
      rent2Amount: body.rent2Amount,
      rent2PaidAt: parseDateOrNull(body.rent2PaidAt),
      bankedPaymentRequired: body.bankedPaymentRequired,
      bankedPaymentVerified: body.bankedPaymentVerified,
      paymentMethod: body.paymentMethod,
      bankOperationNumber: body.bankOperationNumber,
      bankName: body.bankName,
      bankAccountHolder: body.bankAccountHolder,
      paymentEvidencePath: body.paymentEvidencePath,
      fundsSourceDeclared: body.fundsSourceDeclared,
      beneficialOwnerDeclared: body.beneficialOwnerDeclared,
      kycRiskLevel,
      complianceNotes: body.complianceNotes,
      nextActionAt: parseDateOrNull(body.nextActionAt),
    });
  }

  async addDocument(
    applicationSlug: string | undefined,
    body: {
      propertyId: string;
      buyerClientId: string;
      docType: string;
      filePath: string;
      issuedAt?: string | null;
      verifiedAt?: string | null;
      verifiedBy?: string | null;
      notes?: string | null;
    },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    await this.ensureOperationScope(applicationId, body.propertyId, body.buyerClientId);

    if (!body.docType?.trim()) {
      throw new BadRequestException('docType es obligatorio.');
    }
    if (!body.filePath?.trim()) {
      throw new BadRequestException('filePath es obligatorio.');
    }

    return this.compliance.addDocument({
      applicationId,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      docType: body.docType.trim().toUpperCase(),
      filePath: body.filePath.trim(),
      issuedAt: parseDateOrNull(body.issuedAt),
      verifiedAt: parseDateOrNull(body.verifiedAt),
      verifiedBy: body.verifiedBy?.trim() || null,
      notes: body.notes ?? null,
    });
  }

  async listDocuments(
    applicationSlug: string | undefined,
    propertyId: string,
    buyerClientId: string,
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    await this.ensureOperationScope(applicationId, propertyId, buyerClientId);
    return this.compliance.listDocuments(applicationId, propertyId, buyerClientId);
  }

  async getClosingReadiness(
    applicationSlug: string | undefined,
    propertyId: string,
    buyerClientId: string,
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    await this.ensureOperationScope(applicationId, propertyId, buyerClientId);
    return this.compliance.getClosingReadiness(applicationId, propertyId, buyerClientId);
  }

  getTaxPreview(body: {
    salePrice: number;
    acquisitionCost?: number | null;
    alcabalaApplicable?: boolean;
    rent2Applicable?: boolean;
    uit?: number;
  }) {
    if (!Number.isFinite(body.salePrice) || body.salePrice <= 0) {
      throw new BadRequestException('salePrice debe ser mayor que cero.');
    }
    const uit = body.uit && body.uit > 0 ? body.uit : 5500;
    const salePrice = body.salePrice;
    const acquisitionCost = body.acquisitionCost && body.acquisitionCost > 0 ? body.acquisitionCost : 0;
    const alcabalaApplicable = body.alcabalaApplicable !== false;
    const rent2Applicable = body.rent2Applicable === true;

    const alcabalaTaxableBase = Math.max(0, salePrice - uit * 10);
    const alcabalaAmount = alcabalaApplicable ? round2(alcabalaTaxableBase * 0.03) : 0;

    const capitalGain = Math.max(0, salePrice - acquisitionCost);
    const rent2Amount = rent2Applicable ? round2(capitalGain * 0.05) : 0;

    return {
      salePrice,
      acquisitionCost,
      uit,
      alcabala: {
        applicable: alcabalaApplicable,
        taxableBase: alcabalaTaxableBase,
        amount: alcabalaAmount,
      },
      rent2: {
        applicable: rent2Applicable,
        capitalGain,
        amount: rent2Amount,
      },
      legalNote:
        'Estimación referencial. Validar con asesoría legal/tributaria y reglas vigentes del periodo.',
    };
  }

  async listPendingBoard(
    applicationSlug: string | undefined,
    query?: { limit?: number; offset?: number; sunarpStatus?: string; onlyOverdue?: boolean },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const rows = (await this.compliance.listChecklistRows(applicationId, {
      limit: query?.limit,
      offset: query?.offset,
      sunarpStatus: query?.sunarpStatus,
      onlyOverdue: query?.onlyOverdue,
    })) as Array<Record<string, unknown>>;

    const data = await Promise.all(
      rows.map(async (r) => {
        const readiness = await this.compliance.getClosingReadiness(
          applicationId,
          String(r.propertyId),
          String(r.buyerClientId),
        );
        const missing = readiness.missing;
        const kycHigh = String(r.kycRiskLevel ?? '').toUpperCase() === 'HIGH';
        const observed = String(r.sunarpStatus ?? '').toUpperCase() === 'OBSERVED';
        const severity =
          kycHigh || observed || missing.length >= 4
            ? 'HIGH'
            : missing.length > 0
              ? 'MEDIUM'
              : 'LOW';
        return {
          checklistId: r.id,
          propertyId: r.propertyId,
          buyerClientId: r.buyerClientId,
          sunarpStatus: r.sunarpStatus,
          nextActionAt: r.nextActionAt,
          lastAlertSentAt: r.lastAlertSentAt,
          severity,
          missing,
        };
      }),
    );

    data.sort((a, b) => {
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
      const r = rank[b.severity as keyof typeof rank] - rank[a.severity as keyof typeof rank];
      if (r !== 0) return r;
      const at = a.nextActionAt ? new Date(String(a.nextActionAt)).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.nextActionAt ? new Date(String(b.nextActionAt)).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt;
    });

    return { data, total: data.length };
  }

  async dispatchPendingAlerts(
    applicationSlug: string | undefined,
    body?: { dryRun?: boolean; daysWithoutAlert?: number; maxItems?: number },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const daysWithoutAlert = Math.max(0, body?.daysWithoutAlert ?? 1);
    const maxItems = Math.min(200, Math.max(1, body?.maxItems ?? 50));
    const cutoff = new Date(Date.now() - daysWithoutAlert * 24 * 60 * 60 * 1000);
    const board = await this.listPendingBoard(applicationSlug, { limit: maxItems });
    const candidates = board.data.filter((x) => {
      if ((x.missing as string[]).length === 0) return false;
      if (!x.lastAlertSentAt) return true;
      return new Date(String(x.lastAlertSentAt)).getTime() < cutoff.getTime();
    });

    const roleUsers = await this.notificationsService.getUserIdsByRoleCodes([
      'ADMIN',
      'MANAGER',
      'GERENTE',
    ]);
    if (roleUsers.length === 0) {
      return { dryRun: body?.dryRun === true, dispatched: 0, candidates: candidates.length };
    }

    if (body?.dryRun) {
      return { dryRun: true, dispatched: 0, candidates: candidates.length, sample: candidates.slice(0, 5) };
    }

    let dispatched = 0;
    for (const item of candidates) {
      await this.notificationsService.createForUserIds(
        roleUsers,
        'VENTAS_COMPLIANCE_PENDING',
        'Pendiente legal/compliance en cierre de venta',
        `Propiedad ${String(item.propertyId)} · Comprador ${String(item.buyerClientId)} · Pendientes: ${(item.missing as string[]).slice(0, 3).join(', ')}`,
        {
          checklistId: item.checklistId,
          propertyId: item.propertyId,
          buyerClientId: item.buyerClientId,
          severity: item.severity,
          missing: item.missing,
          applicationId,
        },
      );
      await this.compliance.markAlertSent(String(item.checklistId));
      dispatched += 1;
    }
    return { dryRun: false, dispatched, candidates: candidates.length };
  }
}
