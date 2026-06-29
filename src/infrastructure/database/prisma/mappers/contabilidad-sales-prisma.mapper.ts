import type {
  ContabilidadCustomerDto,
  ContabilidadSalesCollectionDto,
  ContabilidadSalesCreditNoteDto,
  ContabilidadSalesInvoiceDto,
} from '@domain/repositories/contabilidad-sales.repository';
import { formatPenAmount } from '@domain/utils/contabilidad-journal-amounts';

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function fullDocNumber(series: string, number: string): string {
  return `${series}-${number}`;
}

export const ContabilidadSalesPrismaMapper = {
  toCustomer(
    row: {
      id: string;
      ruc: string;
      businessName: string;
      tradeName: string | null;
      address: string | null;
      email: string | null;
      phone: string | null;
      isActive: boolean;
      createdAt: Date;
    },
    receivableBalance: number,
    invoiceCount: number,
  ): ContabilidadCustomerDto {
    return {
      id: row.id,
      ruc: row.ruc,
      businessName: row.businessName,
      tradeName: row.tradeName,
      address: row.address,
      email: row.email,
      phone: row.phone,
      isActive: row.isActive,
      receivableBalance: formatPenAmount(receivableBalance),
      invoiceCount,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toInvoice(row: {
    id: string;
    customerId: string;
    periodId: string;
    documentType: string;
    series: string;
    number: string;
    issueDate: Date;
    dueDate: Date | null;
    taxAffectation: string;
    incomeAccountId: string;
    taxableBase: { toString(): string } | number;
    igvAmount: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    collectedAmount: { toString(): string } | number;
    status: string;
    notes: string | null;
    journalEntryId: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
    customer: { ruc: string; businessName: string };
    incomeAccount: { code: string; name: string };
  }): ContabilidadSalesInvoiceDto {
    const total = Number(row.totalAmount);
    const collected = Number(row.collectedAmount);
    return {
      id: row.id,
      customerId: row.customerId,
      customerRuc: row.customer.ruc,
      customerName: row.customer.businessName,
      periodId: row.periodId,
      documentType: row.documentType,
      series: row.series,
      number: row.number,
      fullNumber: fullDocNumber(row.series, row.number),
      issueDate: toIsoDate(row.issueDate),
      dueDate: row.dueDate ? toIsoDate(row.dueDate) : null,
      taxAffectation: row.taxAffectation,
      incomeAccountId: row.incomeAccountId,
      incomeAccountCode: row.incomeAccount.code,
      incomeAccountName: row.incomeAccount.name,
      taxableBase: formatPenAmount(Number(row.taxableBase)),
      igvAmount: formatPenAmount(Number(row.igvAmount)),
      totalAmount: formatPenAmount(total),
      collectedAmount: formatPenAmount(collected),
      balanceAmount: formatPenAmount(Math.max(0, total - collected)),
      status: row.status,
      notes: row.notes,
      journalEntryId: row.journalEntryId,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toCreditNote(row: {
    id: string;
    customerId: string;
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
    customer: { ruc: string; businessName: string };
    invoice?: { series: string; number: string } | null;
  }): ContabilidadSalesCreditNoteDto {
    return {
      id: row.id,
      customerId: row.customerId,
      customerRuc: row.customer.ruc,
      customerName: row.customer.businessName,
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

  toCollection(row: {
    id: string;
    invoiceId: string;
    periodId: string;
    amount: { toString(): string } | number;
    collectionDate: Date;
    description: string;
    sourceType: string;
    cashBoxId: string | null;
    bankAccountId: string | null;
    treasuryMovementId: string | null;
    createdAt: Date;
    invoice: {
      series: string;
      number: string;
      customer: { ruc: string; businessName: string };
    };
    cashBox?: { code: string } | null;
    bankAccount?: { code: string } | null;
    treasuryMovement?: { journalEntryId: string | null } | null;
  }): ContabilidadSalesCollectionDto {
    return {
      id: row.id,
      invoiceId: row.invoiceId,
      invoiceFullNumber: fullDocNumber(row.invoice.series, row.invoice.number),
      customerRuc: row.invoice.customer.ruc,
      customerName: row.invoice.customer.businessName,
      periodId: row.periodId,
      amount: formatPenAmount(Number(row.amount)),
      collectionDate: toIsoDate(row.collectionDate),
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
