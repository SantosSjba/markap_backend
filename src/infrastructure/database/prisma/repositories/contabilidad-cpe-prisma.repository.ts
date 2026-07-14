import { Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_CPE_DOCUMENT_KIND,
  CONTABILIDAD_CPE_SOURCE_TYPE,
} from '@domain/constants/contabilidad-cpe.defaults';
import { CONTABILIDAD_SALES_STATUS } from '@domain/constants/contabilidad-sales.defaults';
import type {
  ContabilidadCpeDocumentArtifactDto,
  ContabilidadCpeEmitResultDto,
  ContabilidadCpeProviderConfigDto,
  ContabilidadCpeRepository,
  CpeSalesInvoiceEmitContext,
  UpsertCpeProviderConfigInput,
} from '@domain/repositories/contabilidad-cpe.repository';
import { PrismaService } from '../prisma.service';
import { formatDateOnly } from '@domain/utils/peru-date.util';

function maskToken(token: string): string {
  const t = token.trim();
  if (t.length <= 4) return '****';
  return `****${t.slice(-4)}`;
}

function encodeToken(token: string): string {
  return Buffer.from(token.trim(), 'utf8').toString('base64');
}

function mapProviderConfig(row: {
  id: string;
  legalEntityId: string;
  providerCode: string;
  apiBaseUrl: string | null;
  apiTokenHint: string | null;
  apiTokenEnc: string | null;
  certificateHint: string | null;
  useSandbox: boolean;
  isActive: boolean;
  updatedAt: Date;
  legalEntity: { code: string; ruc: string };
}): ContabilidadCpeProviderConfigDto {
  return {
    id: row.id,
    legalEntityId: row.legalEntityId,
    legalEntityCode: row.legalEntity.code,
    legalEntityRuc: row.legalEntity.ruc,
    providerCode: row.providerCode,
    apiBaseUrl: row.apiBaseUrl,
    apiTokenHint: row.apiTokenHint,
    hasApiToken: Boolean(row.apiTokenEnc),
    certificateHint: row.certificateHint,
    useSandbox: row.useSandbox,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function documentKindFromType(documentType: string): string {
  if (documentType === 'BOLETA') return CONTABILIDAD_CPE_DOCUMENT_KIND.BOLETA;
  return CONTABILIDAD_CPE_DOCUMENT_KIND.FACTURA;
}

@Injectable()
export class ContabilidadCpePrismaRepository implements ContabilidadCpeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderConfig(
    applicationId: string,
    legalEntityId: string,
  ): Promise<ContabilidadCpeProviderConfigDto | null> {
    const row = await this.prisma.contabilidadCpeProviderConfig.findFirst({
      where: { applicationId, legalEntityId },
      include: { legalEntity: { select: { code: true, ruc: true } } },
    });
    return row ? mapProviderConfig(row) : null;
  }

  async upsertProviderConfig(
    applicationId: string,
    legalEntityId: string,
    input: UpsertCpeProviderConfigInput,
  ): Promise<ContabilidadCpeProviderConfigDto> {
    const existing = await this.prisma.contabilidadCpeProviderConfig.findFirst({
      where: { applicationId, legalEntityId },
    });

    const tokenData =
      input.apiToken !== undefined
        ? input.apiToken?.trim()
          ? { apiTokenHint: maskToken(input.apiToken), apiTokenEnc: encodeToken(input.apiToken) }
          : { apiTokenHint: null, apiTokenEnc: null }
        : {};

    const row = existing
      ? await this.prisma.contabilidadCpeProviderConfig.update({
          where: { id: existing.id },
          data: {
            providerCode: input.providerCode?.trim() || existing.providerCode,
            apiBaseUrl: input.apiBaseUrl !== undefined ? input.apiBaseUrl?.trim() || null : undefined,
            certificateHint:
              input.certificateHint !== undefined ? input.certificateHint?.trim() || null : undefined,
            useSandbox: input.useSandbox ?? undefined,
            isActive: input.isActive ?? undefined,
            ...tokenData,
          },
          include: { legalEntity: { select: { code: true, ruc: true } } },
        })
      : await this.prisma.contabilidadCpeProviderConfig.create({
          data: {
            applicationId,
            legalEntityId,
            providerCode: input.providerCode?.trim() || 'MOCK',
            apiBaseUrl: input.apiBaseUrl?.trim() || null,
            certificateHint: input.certificateHint?.trim() || null,
            useSandbox: input.useSandbox ?? true,
            isActive: input.isActive ?? true,
            ...tokenData,
          },
          include: { legalEntity: { select: { code: true, ruc: true } } },
        });

    return mapProviderConfig(row);
  }

  async getSalesInvoiceEmitContext(
    applicationId: string,
    invoiceId: string,
  ): Promise<CpeSalesInvoiceEmitContext | null> {
    const row = await this.prisma.contabilidadSalesInvoice.findFirst({
      where: { applicationId, id: invoiceId },
      include: {
        customer: { select: { ruc: true, businessName: true, address: true } },
        period: {
          select: {
            id: true,
            legalEntityId: true,
            legalEntity: {
              select: {
                ruc: true,
                legalName: true,
                tradeName: true,
                fiscalAddress: true,
              },
            },
          },
        },
      },
    });
    if (!row || row.status === CONTABILIDAD_SALES_STATUS.CANCELLED) return null;

    const fullNumber = `${row.series}-${row.number}`;
    return {
      applicationId,
      legalEntityId: row.period.legalEntityId,
      invoiceId: row.id,
      periodId: row.periodId,
      documentType: row.documentType,
      series: row.series,
      number: row.number,
      fullNumber,
      issueDate: formatDateOnly(row.issueDate),
      taxAffectation: row.taxAffectation,
      currencyCode: row.currencyCode,
      taxableBase: row.taxableBase.toString(),
      igvAmount: row.igvAmount.toString(),
      totalAmount: row.totalAmount.toString(),
      customerRuc: row.customer.ruc,
      customerName: row.customer.businessName,
      customerAddress: row.customer.address,
      issuerRuc: row.period.legalEntity.ruc,
      issuerLegalName: row.period.legalEntity.legalName,
      issuerTradeName: row.period.legalEntity.tradeName,
      issuerAddress: row.period.legalEntity.fiscalAddress,
      existingLogId: row.electronicLogId,
      currentElectronicStatus: row.electronicStatus,
    };
  }

  async saveEmitResult(input: {
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
  }): Promise<ContabilidadCpeEmitResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const logData = {
        applicationId: input.applicationId,
        legalEntityId: input.legalEntityId,
        periodId: input.periodId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        documentKind: input.documentKind,
        documentRef: input.documentRef,
        sunatStatus: input.sunatStatus,
        sunatResponseCode: input.sunatResponseCode,
        sunatResponseMessage: input.sunatResponseMessage,
        xmlHash: input.xmlHash,
        xmlContent: input.xmlContent,
        cdrReference: input.cdrReference,
        cdrContent: input.cdrContent,
        sentAt: input.sentAt,
        acceptedAt: input.acceptedAt,
      };

      const log = input.existingLogId
        ? await tx.contabilidadElectronicDocumentLog.update({
            where: { id: input.existingLogId },
            data: logData,
          })
        : await tx.contabilidadElectronicDocumentLog.create({ data: logData });

      if (input.sourceType === CONTABILIDAD_CPE_SOURCE_TYPE.SALES_INVOICE) {
        await tx.contabilidadSalesInvoice.update({
          where: { id: input.sourceId },
          data: {
            electronicStatus: input.sunatStatus,
            electronicLogId: log.id,
          },
        });
      }

      return {
        logId: log.id,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        documentRef: input.documentRef,
        sunatStatus: input.sunatStatus,
        sunatResponseCode: input.sunatResponseCode,
        sunatResponseMessage: input.sunatResponseMessage,
        xmlHash: input.xmlHash,
        cdrReference: input.cdrReference,
        electronicStatus: input.sunatStatus,
      };
    });
  }

  async getDocumentArtifact(
    applicationId: string,
    logId: string,
    kind: 'xml' | 'cdr',
  ): Promise<ContabilidadCpeDocumentArtifactDto | null> {
    const row = await this.prisma.contabilidadElectronicDocumentLog.findFirst({
      where: { applicationId, id: logId },
    });
    if (!row) return null;

    const content = kind === 'xml' ? row.xmlContent : row.cdrContent;
    if (!content) return null;

    const ext = kind === 'xml' ? 'xml' : 'xml';
    const safeRef = row.documentRef.replace(/[^a-zA-Z0-9-]/g, '_');

    return {
      logId: row.id,
      documentRef: row.documentRef,
      contentType: 'application/xml',
      filename: kind === 'xml' ? `${safeRef}.xml` : `${safeRef}-CDR.xml`,
      content,
    };
  }
}
