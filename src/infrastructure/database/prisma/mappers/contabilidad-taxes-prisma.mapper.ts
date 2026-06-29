import { formatPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import type {
  ContabilidadDetraccionDto,
  ContabilidadDetraccionRateDto,
  ContabilidadPerceptionDto,
  ContabilidadRetentionDto,
} from '@domain/repositories/contabilidad-taxes.repository';

export const ContabilidadTaxesPrismaMapper = {
  toDetraccionRate(row: {
    id: string;
    sunatCode: string;
    description: string;
    ratePercent: { toString(): string } | number;
    minAmount: { toString(): string } | number;
    isActive: boolean;
  }): ContabilidadDetraccionRateDto {
    return {
      id: row.id,
      sunatCode: row.sunatCode,
      description: row.description,
      ratePercent: formatPenAmount(Number(row.ratePercent)),
      minAmount: formatPenAmount(Number(row.minAmount)),
      isActive: row.isActive,
    };
  },

  toDetraccion(row: {
    id: string;
    periodId: string;
    purchaseInvoiceId: string | null;
    rateId: string | null;
    supplierRuc: string;
    supplierName: string;
    certificateNumber: string;
    operationDate: Date;
    baseAmount: { toString(): string } | number;
    ratePercent: { toString(): string } | number;
    amount: { toString(): string } | number;
    status: string;
    paidAt: Date | null;
    treasuryMovementId: string | null;
    journalEntryId: string | null;
    createdAt: Date;
    purchaseInvoice?: { series: string; number: string } | null;
    rate?: { description: string } | null;
  }): ContabilidadDetraccionDto {
    return {
      id: row.id,
      periodId: row.periodId,
      purchaseInvoiceId: row.purchaseInvoiceId,
      invoiceFullNumber: row.purchaseInvoice
        ? `${row.purchaseInvoice.series}-${row.purchaseInvoice.number}`
        : null,
      rateId: row.rateId,
      rateDescription: row.rate?.description ?? null,
      supplierRuc: row.supplierRuc,
      supplierName: row.supplierName,
      certificateNumber: row.certificateNumber,
      operationDate: row.operationDate.toISOString().slice(0, 10),
      baseAmount: formatPenAmount(Number(row.baseAmount)),
      ratePercent: formatPenAmount(Number(row.ratePercent)),
      amount: formatPenAmount(Number(row.amount)),
      status: row.status,
      paidAt: row.paidAt?.toISOString() ?? null,
      treasuryMovementId: row.treasuryMovementId,
      journalEntryId: row.journalEntryId,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toRetention(row: {
    id: string;
    periodId: string;
    retentionType: string;
    counterpartyRuc: string;
    counterpartyName: string;
    documentType: string | null;
    documentSeries: string | null;
    documentNumber: string | null;
    issueDate: Date;
    taxableBase: { toString(): string } | number;
    ratePercent: { toString(): string } | number;
    amount: { toString(): string } | number;
    purchaseInvoiceId: string | null;
    journalEntryId: string | null;
    status: string;
    createdAt: Date;
  }): ContabilidadRetentionDto {
    const fullDocument =
      row.documentSeries && row.documentNumber
        ? `${row.documentSeries}-${row.documentNumber}`
        : row.documentNumber;
    return {
      id: row.id,
      periodId: row.periodId,
      retentionType: row.retentionType,
      counterpartyRuc: row.counterpartyRuc,
      counterpartyName: row.counterpartyName,
      documentType: row.documentType,
      documentSeries: row.documentSeries,
      documentNumber: row.documentNumber,
      fullDocument: fullDocument ?? null,
      issueDate: row.issueDate.toISOString().slice(0, 10),
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      ratePercent: formatPenAmount(Number(row.ratePercent)),
      amount: formatPenAmount(Number(row.amount)),
      purchaseInvoiceId: row.purchaseInvoiceId,
      journalEntryId: row.journalEntryId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toPerception(row: {
    id: string;
    periodId: string;
    perceptionType: string;
    customerRuc: string;
    customerName: string;
    salesInvoiceId: string | null;
    issueDate: Date;
    taxableBase: { toString(): string } | number;
    ratePercent: { toString(): string } | number;
    amount: { toString(): string } | number;
    treasuryMovementId: string | null;
    journalEntryId: string | null;
    status: string;
    createdAt: Date;
    salesInvoice?: { series: string; number: string } | null;
  }): ContabilidadPerceptionDto {
    return {
      id: row.id,
      periodId: row.periodId,
      perceptionType: row.perceptionType,
      customerRuc: row.customerRuc,
      customerName: row.customerName,
      salesInvoiceId: row.salesInvoiceId,
      invoiceFullNumber: row.salesInvoice
        ? `${row.salesInvoice.series}-${row.salesInvoice.number}`
        : null,
      issueDate: row.issueDate.toISOString().slice(0, 10),
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      ratePercent: formatPenAmount(Number(row.ratePercent)),
      amount: formatPenAmount(Number(row.amount)),
      treasuryMovementId: row.treasuryMovementId,
      journalEntryId: row.journalEntryId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  },
};
