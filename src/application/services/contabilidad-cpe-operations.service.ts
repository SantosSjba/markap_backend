import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_CPE_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_CPE_ELECTRONIC_STATUS,
  CONTABILIDAD_CPE_PROVIDER,
  CONTABILIDAD_CPE_PROVIDER_LABELS,
  CONTABILIDAD_CPE_STATUS_LABELS,
} from '@domain/constants/contabilidad-cpe.defaults';
import { CONTABILIDAD_CPE_SOURCE_TYPE } from '@domain/constants/contabilidad-cpe.defaults';
import { EntityNotFoundException } from '@domain/exceptions';
import type {
  ContabilidadCpeRepository,
  UpsertCpeProviderConfigInput,
} from '@domain/repositories/contabilidad-cpe.repository';
import { ContabilidadContextService } from './contabilidad-context.service';
import { ContabilidadCpeEmitterService } from './contabilidad-cpe-emitter.service';
import { ContabilidadCpeUblService } from './contabilidad-cpe-ubl.service';
import { hashXmlContent, cpeDocumentKindFromSalesType } from '@domain/utils/contabilidad-cpe.util';

@Injectable()
export class ContabilidadCpeOperationsService {
  constructor(
    private readonly context: ContabilidadContextService,
    @Inject(CONTABILIDAD_CPE_REPOSITORY)
    private readonly cpe: ContabilidadCpeRepository,
    private readonly ubl: ContabilidadCpeUblService,
    private readonly emitter: ContabilidadCpeEmitterService,
  ) {}

  async getProviderConfig(applicationSlug?: string, legalEntityId?: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    let config = await this.cpe.getProviderConfig(applicationId, entityId);
    if (!config) {
      config = await this.cpe.upsertProviderConfig(applicationId, entityId, {
        providerCode: CONTABILIDAD_CPE_PROVIDER.MOCK,
        useSandbox: true,
        isActive: true,
      });
    }
    return {
      config,
      providerLabels: CONTABILIDAD_CPE_PROVIDER_LABELS,
      statusLabels: CONTABILIDAD_CPE_STATUS_LABELS,
    };
  }

  async saveProviderConfig(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    body: UpsertCpeProviderConfigInput,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const config = await this.cpe.upsertProviderConfig(applicationId, entityId, body);
    return { config, providerLabels: CONTABILIDAD_CPE_PROVIDER_LABELS };
  }

  async emitSalesInvoice(
    applicationSlug: string | undefined,
    legalEntityId: string | undefined,
    invoiceId: string,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const ctx = await this.cpe.getSalesInvoiceEmitContext(applicationId, invoiceId);
    if (!ctx) throw new EntityNotFoundException('ContabilidadSalesInvoice', invoiceId);

    const resolvedEntityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    if (ctx.legalEntityId !== resolvedEntityId) {
      throw new BadRequestException('El comprobante no pertenece a la entidad legal activa.');
    }

    if (ctx.currentElectronicStatus === CONTABILIDAD_CPE_ELECTRONIC_STATUS.ACCEPTED) {
      throw new BadRequestException('El comprobante ya fue aceptado por SUNAT.');
    }

    let config = await this.cpe.getProviderConfig(applicationId, ctx.legalEntityId);
    if (!config) {
      config = await this.cpe.upsertProviderConfig(applicationId, ctx.legalEntityId, {
        providerCode: CONTABILIDAD_CPE_PROVIDER.MOCK,
        useSandbox: true,
        isActive: true,
      });
    }

    const { xml } = this.ubl.buildSalesInvoiceXml(ctx);
    const xmlHash = hashXmlContent(xml);

    const emitResult = await this.emitter.emit({
      xml,
      documentRef: ctx.fullNumber,
      config,
    });

    return this.cpe.saveEmitResult({
      applicationId,
      legalEntityId: ctx.legalEntityId,
      periodId: ctx.periodId,
      sourceType: CONTABILIDAD_CPE_SOURCE_TYPE.SALES_INVOICE,
      sourceId: ctx.invoiceId,
      documentKind: cpeDocumentKindFromSalesType(ctx.documentType),
      documentRef: ctx.fullNumber,
      sunatStatus: emitResult.sunatStatus,
      sunatResponseCode: emitResult.responseCode,
      sunatResponseMessage: emitResult.responseMessage,
      xmlHash,
      xmlContent: xml,
      cdrReference: emitResult.cdrReference,
      cdrContent: emitResult.cdrContent,
      existingLogId: ctx.existingLogId,
      sentAt: emitResult.sentAt,
      acceptedAt: emitResult.acceptedAt,
    });
  }

  async downloadArtifact(
    applicationSlug: string | undefined,
    logId: string,
    kind: 'xml' | 'cdr',
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const artifact = await this.cpe.getDocumentArtifact(applicationId, logId, kind);
    if (!artifact) throw new EntityNotFoundException('ContabilidadElectronicDocumentLog', logId);
    return artifact;
  }
}
