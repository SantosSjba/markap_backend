import type {
  ContabilidadPurchaseCreditNoteDto,
  ContabilidadPurchaseDebitNoteDto,
  ContabilidadPurchaseInvoiceDto,
  ContabilidadPurchasePaymentDto,
  ContabilidadSupplierDto,
} from '@domain/repositories/contabilidad-purchases.repository';
import { formatPenAmount } from '@domain/utils/contabilidad-journal-amounts';

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function fullDocNumber(series: string, number: string): string {
  return `${series}-${number}`;
}

export const ContabilidadPurchasesPrismaMapper = {
  toSupplier(
    row: {
      id: string;
      ruc: string;
      businessName: string;
      countryCode: string;
      isNonDomiciled: boolean;
      tradeName: string | null;
      address: string | null;
      email: string | null;
      phone: string | null;
      isActive: boolean;
      createdAt: Date;
    },
    payableBalance: number,
    invoiceCount: number,
  ): ContabilidadSupplierDto {
    return {
      id: row.id,
      ruc: row.ruc,
      businessName: row.businessName,
      countryCode: row.countryCode,
      isNonDomiciled: row.isNonDomiciled,
      tradeName: row.tradeName,
      address: row.address,
      email: row.email,
      phone: row.phone,
      isActive: row.isActive,
      payableBalance: formatPenAmount(payableBalance),
      invoiceCount,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toInvoice(row: {
    id: string;
    supplierId: string;
    periodId: string;
    documentType: string;
    series: string;
    number: string;
    issueDate: Date;
    dueDate: Date | null;
    taxAffectation: string;
    expenseAccountId: string;
    taxableBase: { toString(): string } | number;
    igvAmount: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    detraccionAmount: { toString(): string } | number;
    paidAmount: { toString(): string } | number;
    status: string;
    notes: string | null;
    journalEntryId: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
    supplier: { ruc: string; businessName: string };
    expenseAccount: { code: string; name: string };
  }): ContabilidadPurchaseInvoiceDto {
    const total = Number(row.totalAmount);
    const paid = Number(row.paidAmount);
    return {
      id: row.id,
      supplierId: row.supplierId,
      supplierRuc: row.supplier.ruc,
      supplierName: row.supplier.businessName,
      periodId: row.periodId,
      documentType: row.documentType,
      series: row.series,
      number: row.number,
      fullNumber: fullDocNumber(row.series, row.number),
      issueDate: toIsoDate(row.issueDate),
      dueDate: row.dueDate ? toIsoDate(row.dueDate) : null,
      taxAffectation: row.taxAffectation,
      expenseAccountId: row.expenseAccountId,
      expenseAccountCode: row.expenseAccount.code,
      expenseAccountName: row.expenseAccount.name,
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      igvAmount: formatPenAmount(Number(row.igvAmount)),
      totalAmount: formatPenAmount(Number(row.totalAmount)),
      detraccionAmount: formatPenAmount(Number(row.detraccionAmount)),
      paidAmount: formatPenAmount(Number(row.paidAmount)),
      balanceAmount: formatPenAmount(Math.max(0, total - paid)),
      status: row.status,
      notes: row.notes,
      journalEntryId: row.journalEntryId,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toCreditNote(row: {
    id: string;
    supplierId: string;
    invoiceId: string | null;
    periodId: string;
    series: string;
    number: string;
    issueDate: Date;
    taxableBase: { toString(): string } | number;
    igvAmount: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    reason: string | null;
    status: string;
    journalEntryId: string | null;
    createdAt: Date;
    supplier: { ruc: string; businessName: string };
    invoice?: { series: string; number: string } | null;
  }): ContabilidadPurchaseCreditNoteDto {
    return {
      id: row.id,
      supplierId: row.supplierId,
      supplierRuc: row.supplier.ruc,
      supplierName: row.supplier.businessName,
      invoiceId: row.invoiceId,
      invoiceFullNumber: row.invoice ? fullDocNumber(row.invoice.series, row.invoice.number) : null,
      periodId: row.periodId,
      series: row.series,
      number: row.number,
      fullNumber: fullDocNumber(row.series, row.number),
      issueDate: toIsoDate(row.issueDate),
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      igvAmount: formatPenAmount(Number(row.igvAmount)),
      totalAmount: formatPenAmount(Number(row.totalAmount)),
      reason: row.reason,
      status: row.status,
      journalEntryId: row.journalEntryId,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toDebitNote(row: {
    id: string;
    supplierId: string;
    invoiceId: string | null;
    periodId: string;
    series: string;
    number: string;
    issueDate: Date;
    taxableBase: { toString(): string } | number;
    igvAmount: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    reason: string | null;
    status: string;
    journalEntryId: string | null;
    createdAt: Date;
    supplier: { ruc: string; businessName: string };
    invoice?: { series: string; number: string } | null;
  }): ContabilidadPurchaseDebitNoteDto {
    return {
      id: row.id,
      supplierId: row.supplierId,
      supplierRuc: row.supplier.ruc,
      supplierName: row.supplier.businessName,
      invoiceId: row.invoiceId,
      invoiceFullNumber: row.invoice ? fullDocNumber(row.invoice.series, row.invoice.number) : null,
      periodId: row.periodId,
      series: row.series,
      number: row.number,
      fullNumber: fullDocNumber(row.series, row.number),
      issueDate: toIsoDate(row.issueDate),
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      igvAmount: formatPenAmount(Number(row.igvAmount)),
      totalAmount: formatPenAmount(Number(row.totalAmount)),
      reason: row.reason,
      status: row.status,
      journalEntryId: row.journalEntryId,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toPayment(row: {
    id: string;
    invoiceId: string;
    periodId: string;
    amount: { toString(): string } | number;
    paymentDate: Date;
    description: string;
    sourceType: string;
    cashBoxId: string | null;
    bankAccountId: string | null;
    treasuryMovementId: string | null;
    createdAt: Date;
    invoice: {
      series: string;
      number: string;
      supplier: { ruc: string; businessName: string };
    };
    cashBox?: { code: string } | null;
    bankAccount?: { code: string } | null;
    treasuryMovement?: { journalEntryId: string | null } | null;
  }): ContabilidadPurchasePaymentDto {
    return {
      id: row.id,
      invoiceId: row.invoiceId,
      invoiceFullNumber: fullDocNumber(row.invoice.series, row.invoice.number),
      supplierRuc: row.invoice.supplier.ruc,
      supplierName: row.invoice.supplier.businessName,
      periodId: row.periodId,
      amount: formatPenAmount(Number(row.amount)),
      paymentDate: toIsoDate(row.paymentDate),
      description: row.description,
      sourceType: row.sourceType,
      cashBoxId: row.cashBoxId,
      cashBoxCode: row.cashBox?.code ?? null,
      bankAccountId: row.bankAccountId,
      bankCode: row.bankAccount?.code ?? null,
      treasuryMovementId: row.treasuryMovementId,
      journalEntryId: row.treasuryMovement?.journalEntryId ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  },
};
