import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_LEGAL_ENTITY_REPOSITORY,
  CONTABILIDAD_SOL_REPOSITORY,
  CONTABILIDAD_TAXES_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_SOL_DECLARATION_STATUS,
  CONTABILIDAD_SOL_DECLARATION_TYPE,
  CONTABILIDAD_SOL_DECLARATION_TYPE_LABELS,
  CONTABILIDAD_SOL_DECLARATION_STATUS_LABELS,
  CONTABILIDAD_SOL_MANUAL_INSTRUCTIONS,
  CONTABILIDAD_SOL_MOCK_ACCEPT_CODE,
  CONTABILIDAD_SOL_MOCK_ACCEPT_MESSAGE,
} from '@domain/constants/contabilidad-sol.defaults';
import { EntityNotFoundException } from '@domain/exceptions';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadLegalEntityRepository } from '@domain/repositories/contabilidad-legal-entity.repository';
import type {
  ContabilidadSolRepository,
  UpsertSolCredentialsInput,
} from '@domain/repositories/contabilidad-sol.repository';
import type { ContabilidadTaxesRepository } from '@domain/repositories/contabilidad-taxes.repository';
import {
  buildPdt621Package,
  buildPlameDraftPackage,
  hashSolPackage,
} from '@domain/utils/contabilidad-sol.util';
import { ContabilidadContextService } from './contabilidad-context.service';

@Injectable()
export class ContabilidadSolOperationsService {
  constructor(
    private readonly context: ContabilidadContextService,
    @Inject(CONTABILIDAD_SOL_REPOSITORY)
    private readonly sol: ContabilidadSolRepository,
    @Inject(CONTABILIDAD_TAXES_REPOSITORY)
    private readonly taxes: ContabilidadTaxesRepository,
    @Inject(CONTABILIDAD_CONFIG_REPOSITORY)
    private readonly config: ContabilidadConfigRepository,
    @Inject(CONTABILIDAD_LEGAL_ENTITY_REPOSITORY)
    private readonly legalEntities: ContabilidadLegalEntityRepository,
  ) {}

  async getCredentials(applicationSlug?: string, legalEntityId?: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    let credentials = await this.sol.getCredentials(applicationId, entityId);
    if (!credentials) {
      const entity = await this.legalEntities.findById(applicationId, entityId);
      credentials = await this.sol.upsertCredentials(applicationId, entityId, {
        solUser: entity?.ruc ?? '',
        useSandbox: true,
        isActive: false,
      });
    }
    return {
      credentials,
      typeLabels: CONTABILIDAD_SOL_DECLARATION_TYPE_LABELS,
      statusLabels: CONTABILIDAD_SOL_DECLARATION_STATUS_LABELS,
      manualInstructions: CONTABILIDAD_SOL_MANUAL_INSTRUCTIONS,
    };
  }

  async saveCredentials(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    body: UpsertSolCredentialsInput,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const credentials = await this.sol.upsertCredentials(applicationId, entityId, body);
    return { credentials };
  }

  async listDeclarations(
    applicationSlug?: string,
    legalEntityId?: string,
    periodId?: string,
    declarationType?: string,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const logs = await this.sol.listDeclarations(applicationId, entityId, {
      periodId,
      declarationType,
      limit: 100,
    });
    const latest = periodId
      ? await this.sol.findLatestDeclaration(
          applicationId,
          entityId,
          periodId,
          declarationType ?? CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
        )
      : logs[0] ?? null;
    return {
      logs,
      latest,
      typeLabels: CONTABILIDAD_SOL_DECLARATION_TYPE_LABELS,
      statusLabels: CONTABILIDAD_SOL_DECLARATION_STATUS_LABELS,
    };
  }

  async preparePdt621(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    periodId: string,
    userId?: string | null,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const periodCtx = await this.sol.getPeriodLegalEntity(applicationId, periodId);
    if (!periodCtx) throw new EntityNotFoundException('Period', periodId);
    if (periodCtx.legalEntityId !== entityId) {
      throw new BadRequestException('El periodo no pertenece a la entidad legal activa.');
    }

    const settings = await this.config.getSettings(applicationId);
    const exportData = await this.taxes.getPdt621Export(
      applicationId,
      periodId,
      { ruc: periodCtx.ruc, legalName: periodCtx.legalName },
      settings.igvPercent,
    );

    const packageObj = buildPdt621Package(exportData, {
      ruc: periodCtx.ruc,
      legalName: periodCtx.legalName,
      code: periodCtx.code,
    });
    const packageJson = JSON.stringify(packageObj, null, 2);
    const packageHash = hashSolPackage(packageJson);

    const existing = await this.sol.findLatestDeclaration(
      applicationId,
      entityId,
      periodId,
      CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
    );

    const log = await this.sol.saveDeclaration({
      applicationId,
      legalEntityId: entityId,
      periodId,
      declarationType: CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
      status: CONTABILIDAD_SOL_DECLARATION_STATUS.PREPARED,
      packageJson,
      packageHash,
      createdBy: userId ?? null,
      existingLogId:
        existing && existing.status !== CONTABILIDAD_SOL_DECLARATION_STATUS.ACCEPTED
          ? existing.id
          : null,
    });

    return {
      logId: log.id,
      declarationType: log.declarationType,
      status: log.status,
      packageHash,
      package: packageObj,
      manualInstructions: CONTABILIDAD_SOL_MANUAL_INSTRUCTIONS,
    };
  }

  async markPdt621ManualPending(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    periodId: string,
    logId: string,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const latest = await this.sol.findLatestDeclaration(
      applicationId,
      entityId,
      periodId,
      CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
    );
    if (!latest || latest.id !== logId) {
      throw new EntityNotFoundException('ContabilidadSunatDeclarationLog', logId);
    }

    const content = await this.sol.getPackageContent(applicationId, logId);
    const log = await this.sol.saveDeclaration({
      applicationId,
      legalEntityId: entityId,
      periodId,
      declarationType: CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
      status: CONTABILIDAD_SOL_DECLARATION_STATUS.MANUAL_PENDING,
      packageJson: content ?? '{}',
      packageHash: latest.packageHash ?? hashSolPackage(content ?? ''),
      existingLogId: logId,
    });

    return { log, manualInstructions: CONTABILIDAD_SOL_MANUAL_INSTRUCTIONS };
  }

  async submitPdt621(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    periodId: string,
    logId: string,
    userId?: string | null,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const credentials = await this.sol.getCredentials(applicationId, entityId);
    if (!credentials?.isActive) {
      throw new BadRequestException('Configure credenciales SOL activas antes de enviar.');
    }
    if (!credentials.hasSolPassword || !credentials.solUser.trim()) {
      throw new BadRequestException('Usuario y clave SOL son requeridos para envío automático.');
    }

    const latest = await this.sol.findLatestDeclaration(
      applicationId,
      entityId,
      periodId,
      CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
    );
    if (!latest || latest.id !== logId) {
      throw new EntityNotFoundException('ContabilidadSunatDeclarationLog', logId);
    }

    if (!credentials.useSandbox) {
      throw new BadRequestException(
        'Envío automático a SUNAT no está integrado. Use sandbox o carga manual en SOL.',
      );
    }

    const now = new Date();
    const content = await this.sol.getPackageContent(applicationId, logId);

    const log = await this.sol.saveDeclaration({
      applicationId,
      legalEntityId: entityId,
      periodId,
      declarationType: CONTABILIDAD_SOL_DECLARATION_TYPE.PDT_621,
      status: CONTABILIDAD_SOL_DECLARATION_STATUS.ACCEPTED,
      packageJson: content ?? '{}',
      packageHash: latest.packageHash ?? hashSolPackage(content ?? ''),
      sunatResponseCode: CONTABILIDAD_SOL_MOCK_ACCEPT_CODE,
      sunatResponseMessage: `${CONTABILIDAD_SOL_MOCK_ACCEPT_MESSAGE} [${latest.periodYear}-${String(latest.periodMonth).padStart(2, '0')}]`,
      submittedAt: now,
      acceptedAt: now,
      createdBy: userId ?? null,
      existingLogId: logId,
    });

    return { log, mode: 'SANDBOX' as const };
  }

  async preparePlameDraft(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    periodId: string,
    userId?: string | null,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const periodCtx = await this.sol.getPeriodLegalEntity(applicationId, periodId);
    if (!periodCtx) throw new EntityNotFoundException('Period', periodId);

    const packageObj = buildPlameDraftPackage({
      ruc: periodCtx.ruc,
      legalName: periodCtx.legalName,
      year: periodCtx.year,
      month: periodCtx.month,
    });
    const packageJson = JSON.stringify(packageObj, null, 2);
    const packageHash = hashSolPackage(packageJson);

    const existing = await this.sol.findLatestDeclaration(
      applicationId,
      entityId,
      periodId,
      CONTABILIDAD_SOL_DECLARATION_TYPE.PLAME,
    );

    const log = await this.sol.saveDeclaration({
      applicationId,
      legalEntityId: entityId,
      periodId,
      declarationType: CONTABILIDAD_SOL_DECLARATION_TYPE.PLAME,
      status: CONTABILIDAD_SOL_DECLARATION_STATUS.PREPARED,
      packageJson,
      packageHash,
      createdBy: userId ?? null,
      existingLogId: existing?.id ?? null,
    });

    return {
      logId: log.id,
      declarationType: log.declarationType,
      status: log.status,
      package: packageObj,
      note: String(packageObj.note),
    };
  }

  async downloadPackage(applicationSlug: string | undefined, logId: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const content = await this.sol.getPackageContent(applicationId, logId);
    if (!content) throw new EntityNotFoundException('ContabilidadSunatDeclarationLog', logId);

    const match = await this.sol.findDeclarationById(applicationId, logId);
    if (!match) throw new EntityNotFoundException('ContabilidadSunatDeclarationLog', logId);

    const filename = `${match.declarationType}_${match.periodYear}-${String(match.periodMonth).padStart(2, '0')}_${match.legalEntityRuc}.json`;
    return { filename, content };
  }
}
