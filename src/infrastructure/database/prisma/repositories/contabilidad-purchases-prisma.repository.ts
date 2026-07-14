import { Inject, Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_ACCOUNT_REPOSITORY,
  CONTABILIDAD_JOURNAL_REPOSITORY,
  CONTABILIDAD_TREASURY_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_IGV_ACCOUNT_CODE,
  CONTABILIDAD_PAYABLE_ACCOUNT_CODE,
  CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS,
  CONTABILIDAD_PURCHASE_DEBIT_NOTE_STATUS,
  CONTABILIDAD_PURCHASE_STATUS,
  CONTABILIDAD_PURCHASE_TAX_AFFECTATION,
} from '@domain/constants/contabilidad-purchases.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadAccountRepository } from '@domain/repositories/contabilidad-account.repository';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  ContabilidadPurchaseCreditNoteDto,
  ContabilidadPurchaseDebitNoteDto,
  ContabilidadPurchaseInvoiceDto,
  ContabilidadPurchasePaymentDto,
  ContabilidadPurchasesRepository,
  ContabilidadSupplierDto,
  CreatePurchaseCreditNoteInput,
  CreatePurchaseDebitNoteInput,
  CreatePurchaseInvoiceInput,
  CreatePurchasePaymentInput,
  CreateSupplierInput,
  ListPurchaseCreditNotesFilters,
  ListPurchaseDebitNotesFilters,
  ListPurchaseInvoicesFilters,
  ListPurchasePaymentsFilters,
  ListSuppliersFilters,
  UpdateSupplierInput,
} from '@domain/repositories/contabilidad-purchases.repository';
import type { ContabilidadTreasuryRepository } from '@domain/repositories/contabilidad-treasury.repository';
import { parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { parseDateOnly } from '@domain/utils/peru-date.util';
import { resolveInvoiceTaxableBaseInPen } from '../helpers/contabilidad-invoice-multicurrency.helper';
import { PrismaService } from '../prisma.service';
import { ContabilidadPurchasesPrismaMapper } from '../mappers/contabilidad-purchases-prisma.mapper';

const supplierInclude = {
  invoices: {
    where: { status: { not: CONTABILIDAD_PURCHASE_STATUS.CANCELLED } },
    select: { totalAmount: true, paidAmount: true },
  },
  creditNotes: {
    where: { status: CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS.ACTIVE },
    select: { totalAmount: true },
  },
  debitNotes: {
    where: { status: CONTABILIDAD_PURCHASE_DEBIT_NOTE_STATUS.ACTIVE },
    select: { totalAmount: true },
  },
} as const;

const debitNoteInclude = {
  supplier: { select: { ruc: true, businessName: true } },
  invoice: { select: { series: true, number: true } },
} as const;

const invoiceInclude = {
  supplier: { select: { ruc: true, businessName: true } },
  expenseAccount: { select: { code: true, name: true } },
} as const;

const creditNoteInclude = {
  supplier: { select: { ruc: true, businessName: true } },
  invoice: { select: { series: true, number: true } },
} as const;

const paymentInclude = {
  invoice: {
    select: {
      series: true,
      number: true,
      supplier: { select: { ruc: true, businessName: true } },
    },
  },
  cashBox: { select: { code: true } },
  bankAccount: { select: { code: true } },
  treasuryMovement: { select: { journalEntryId: true } },
} as const;

function computeSupplierBalance(
  invoices: { totalAmount: { toString(): string } | number; paidAmount: { toString(): string } | number }[],
  creditNotes: { totalAmount: { toString(): string } | number }[],
  debitNotes: { totalAmount: { toString(): string } | number }[],
): number {
  const invoiceBalance = invoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
    0,
  );
  const creditTotal = creditNotes.reduce((sum, nc) => sum + Number(nc.totalAmount), 0);
  const debitTotal = debitNotes.reduce((sum, nd) => sum + Number(nd.totalAmount), 0);
  return roundPenAmount(Math.max(0, invoiceBalance - creditTotal + debitTotal));
}

function computePurchaseAmounts(
  taxableBase: number | string,
  taxAffectation: string,
  igvPercent: number,
  igvAmountInput?: number | string,
) {
  const base = roundPenAmount(parsePenAmount(taxableBase));
  if (taxAffectation === CONTABILIDAD_PURCHASE_TAX_AFFECTATION.TAXABLE) {
    const igv =
      igvAmountInput !== undefined && igvAmountInput !== ''
        ? roundPenAmount(parsePenAmount(igvAmountInput))
        : roundPenAmount((base * igvPercent) / 100);
    return {
      taxableBase: base,
      igvAmount: igv,
      totalAmount: roundPenAmount(base + igv),
    };
  }
  return { taxableBase: base, igvAmount: 0, totalAmount: base };
}

@Injectable()
export class ContabilidadPurchasesPrismaRepository implements ContabilidadPurchasesRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTABILIDAD_JOURNAL_REPOSITORY)
    private readonly journal: ContabilidadJournalRepository,
    @Inject(CONTABILIDAD_ACCOUNT_REPOSITORY)
    private readonly accounts: ContabilidadAccountRepository,
    @Inject(CONTABILIDAD_TREASURY_REPOSITORY)
    private readonly treasury: ContabilidadTreasuryRepository,
  ) {}

  private async resolveAccountId(applicationId: string, code: string): Promise<string> {
    const account = await this.accounts.findByCode(applicationId, code);
    if (!account?.isActive || !account.isMovement) {
      throw new Error(`Cuenta PCGE ${code} no disponible`);
    }
    return account.id;
  }

  async listSuppliers(
    applicationId: string,
    filters: ListSuppliersFilters,
  ): Promise<ContabilidadSupplierDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadSupplier.findMany({
      where: {
        applicationId,
        ...(filters.activeOnly ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { ruc: { contains: q, mode: 'insensitive' } },
                { businessName: { contains: q, mode: 'insensitive' } },
                { tradeName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: supplierInclude,
      orderBy: [{ businessName: 'asc' }],
    });

    return rows.map((row) =>
      ContabilidadPurchasesPrismaMapper.toSupplier(
        row,
        computeSupplierBalance(row.invoices, row.creditNotes, row.debitNotes),
        row.invoices.length,
      ),
    );
  }

  async findSupplierById(applicationId: string, id: string): Promise<ContabilidadSupplierDto | null> {
    const row = await this.prisma.contabilidadSupplier.findFirst({
      where: { applicationId, id },
      include: supplierInclude,
    });
    if (!row) return null;
    return ContabilidadPurchasesPrismaMapper.toSupplier(
      row,
      computeSupplierBalance(row.invoices, row.creditNotes, row.debitNotes),
      row.invoices.length,
    );
  }

  async createSupplier(applicationId: string, input: CreateSupplierInput): Promise<ContabilidadSupplierDto> {
    const row = await this.prisma.contabilidadSupplier.create({
      data: {
        applicationId,
        ruc: input.ruc.trim(),
        businessName: input.businessName.trim(),
        countryCode: input.countryCode?.trim().toUpperCase() || 'PE',
        isNonDomiciled: input.isNonDomiciled ?? false,
        tradeName: input.tradeName?.trim() || null,
        address: input.address?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      },
      include: supplierInclude,
    });
    return ContabilidadPurchasesPrismaMapper.toSupplier(row, 0, 0);
  }

  async updateSupplier(
    applicationId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<ContabilidadSupplierDto> {
    const row = await this.prisma.contabilidadSupplier.update({
      where: { id },
      data: {
        ...(input.businessName !== undefined ? { businessName: input.businessName.trim() } : {}),
        ...(input.countryCode !== undefined ? { countryCode: input.countryCode.trim().toUpperCase() } : {}),
        ...(input.isNonDomiciled !== undefined ? { isNonDomiciled: input.isNonDomiciled } : {}),
        ...(input.tradeName !== undefined ? { tradeName: input.tradeName?.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
        ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: supplierInclude,
    });
    if (row.applicationId !== applicationId) throw new Error('Supplier not found');
    return ContabilidadPurchasesPrismaMapper.toSupplier(
      row,
      computeSupplierBalance(row.invoices, row.creditNotes, row.debitNotes),
      row.invoices.length,
    );
  }

  async listInvoices(
    applicationId: string,
    filters: ListPurchaseInvoicesFilters,
  ): Promise<ContabilidadPurchaseInvoiceDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadPurchaseInvoice.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { supplier: { businessName: { contains: q, mode: 'insensitive' } } },
                { supplier: { ruc: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: invoiceInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadPurchasesPrismaMapper.toInvoice(row));
  }

  async findInvoiceById(applicationId: string, id: string): Promise<ContabilidadPurchaseInvoiceDto | null> {
    const row = await this.prisma.contabilidadPurchaseInvoice.findFirst({
      where: { applicationId, id },
      include: invoiceInclude,
    });
    return row ? ContabilidadPurchasesPrismaMapper.toInvoice(row) : null;
  }

  async createInvoiceWithJournal(
    applicationId: string,
    input: CreatePurchaseInvoiceInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseInvoiceDto> {
    const supplier = await this.prisma.contabilidadSupplier.findFirst({
      where: { applicationId, id: input.supplierId, isActive: true },
    });
    if (!supplier) throw new Error('Proveedor no encontrado');

    const fx = await resolveInvoiceTaxableBaseInPen(this.prisma, applicationId, {
      currencyCode: input.currencyCode,
      exchangeRate: input.exchangeRate,
      foreignTaxableBase: input.foreignTaxableBase,
      taxableBase: input.taxableBase,
      issueDate: input.issueDate,
    });
    const amounts = computePurchaseAmounts(
      fx.taxableBasePen,
      input.taxAffectation,
      igvPercent,
      input.igvAmount,
    );
    const detraccion = roundPenAmount(parsePenAmount(input.detraccionAmount ?? 0));
    const payableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_PAYABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `Compra ${auxiliaryDoc} — ${supplier.businessName}`;

    const lines: {
      accountId: string;
      debit?: number;
      credit?: number;
      auxiliaryRuc?: string;
      auxiliaryDoc?: string;
    }[] = [
      {
        accountId: input.expenseAccountId,
        debit: amounts.taxableBase,
        auxiliaryRuc: supplier.ruc,
        auxiliaryDoc,
      },
    ];
    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, debit: amounts.igvAmount });
    }

    lines.push({
      accountId: payableAccountId,
      credit: amounts.totalAmount,
      auxiliaryRuc: supplier.ruc,
      auxiliaryDoc,
    });

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.issueDate,
        description,
        lines,
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadPurchaseInvoice.create({
      data: {
        applicationId,
        supplierId: input.supplierId,
        periodId: input.periodId,
        documentType: input.documentType,
        series: input.series.trim().toUpperCase(),
        number: input.number.trim(),
        issueDate: parseDateOnly(input.issueDate),
        dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null,
        taxAffectation: input.taxAffectation,
        currencyCode: fx.currencyCode,
        exchangeRate: fx.exchangeRate,
        foreignTaxableBase: fx.foreignTaxableBase,
        expenseAccountId: input.expenseAccountId,
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        detraccionAmount: detraccion,
        paidAmount: 0,
        status: CONTABILIDAD_PURCHASE_STATUS.PENDING,
        notes: input.notes?.trim() || null,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: invoiceInclude,
    });

    return ContabilidadPurchasesPrismaMapper.toInvoice(row);
  }

  async cancelInvoice(applicationId: string, id: string): Promise<ContabilidadPurchaseInvoiceDto> {
    const existing = await this.prisma.contabilidadPurchaseInvoice.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Factura no encontrada');
    if (existing.status === CONTABILIDAD_PURCHASE_STATUS.CANCELLED) throw new Error('Factura ya anulada');
    if (Number(existing.paidAmount) > 0) throw new Error('No se puede anular una factura con pagos');

    const row = await this.prisma.contabilidadPurchaseInvoice.update({
      where: { id },
      data: {
        status: CONTABILIDAD_PURCHASE_STATUS.CANCELLED,
        cancelledAt: new Date(),
      },
      include: invoiceInclude,
    });
    return ContabilidadPurchasesPrismaMapper.toInvoice(row);
  }

  async listCreditNotes(
    applicationId: string,
    filters: ListPurchaseCreditNotesFilters,
  ): Promise<ContabilidadPurchaseCreditNoteDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadPurchaseCreditNote.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { supplier: { businessName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: creditNoteInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadPurchasesPrismaMapper.toCreditNote(row));
  }

  async createCreditNoteWithJournal(
    applicationId: string,
    input: CreatePurchaseCreditNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseCreditNoteDto> {
    const supplier = await this.prisma.contabilidadSupplier.findFirst({
      where: { applicationId, id: input.supplierId, isActive: true },
    });
    if (!supplier) throw new Error('Proveedor no encontrado');

    let expenseAccountId: string | null = null;
    if (input.invoiceId) {
      const invoice = await this.prisma.contabilidadPurchaseInvoice.findFirst({
        where: { applicationId, id: input.invoiceId, supplierId: input.supplierId },
      });
      if (!invoice) throw new Error('Factura vinculada no encontrada');
      expenseAccountId = invoice.expenseAccountId;
    }
    if (!expenseAccountId) {
      expenseAccountId = await this.resolveAccountId(applicationId, '601');
    }

    const amounts = computePurchaseAmounts(input.taxableBase, CONTABILIDAD_PURCHASE_TAX_AFFECTATION.TAXABLE, igvPercent, input.igvAmount);
    const payableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_PAYABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `NC compra ${auxiliaryDoc} — ${supplier.businessName}`;

    const lines: { accountId: string; debit?: number; credit?: number; auxiliaryRuc?: string; auxiliaryDoc?: string }[] = [
      {
        accountId: payableAccountId,
        debit: amounts.totalAmount,
        auxiliaryRuc: supplier.ruc,
        auxiliaryDoc,
      },
      {
        accountId: expenseAccountId,
        credit: amounts.taxableBase,
        auxiliaryRuc: supplier.ruc,
        auxiliaryDoc: description,
      },
    ];

    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, credit: amounts.igvAmount });
    }

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.issueDate,
        description,
        lines,
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadPurchaseCreditNote.create({
      data: {
        applicationId,
        supplierId: input.supplierId,
        invoiceId: input.invoiceId ?? null,
        periodId: input.periodId,
        series: input.series.trim().toUpperCase(),
        number: input.number.trim(),
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        reason: input.reason?.trim() || null,
        status: CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS.ACTIVE,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: creditNoteInclude,
    });

    return ContabilidadPurchasesPrismaMapper.toCreditNote(row);
  }

  async listDebitNotes(
    applicationId: string,
    filters: ListPurchaseDebitNotesFilters,
  ): Promise<ContabilidadPurchaseDebitNoteDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadPurchaseDebitNote.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { supplier: { businessName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: debitNoteInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadPurchasesPrismaMapper.toDebitNote(row));
  }

  async createDebitNoteWithJournal(
    applicationId: string,
    input: CreatePurchaseDebitNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchaseDebitNoteDto> {
    const supplier = await this.prisma.contabilidadSupplier.findFirst({
      where: { applicationId, id: input.supplierId, isActive: true },
    });
    if (!supplier) throw new Error('Proveedor no encontrado');

    let expenseAccountId: string | null = null;
    if (input.invoiceId) {
      const invoice = await this.prisma.contabilidadPurchaseInvoice.findFirst({
        where: { applicationId, id: input.invoiceId, supplierId: input.supplierId },
      });
      if (!invoice) throw new Error('Factura vinculada no encontrada');
      expenseAccountId = invoice.expenseAccountId;
    }
    if (!expenseAccountId) {
      expenseAccountId = await this.resolveAccountId(applicationId, '601');
    }

    const amounts = computePurchaseAmounts(
      input.taxableBase,
      CONTABILIDAD_PURCHASE_TAX_AFFECTATION.TAXABLE,
      igvPercent,
      input.igvAmount,
    );
    const payableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_PAYABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `ND compra ${auxiliaryDoc} — ${supplier.businessName}`;

    const lines: { accountId: string; debit?: number; credit?: number; auxiliaryRuc?: string; auxiliaryDoc?: string }[] = [
      {
        accountId: expenseAccountId,
        debit: amounts.taxableBase,
        auxiliaryRuc: supplier.ruc,
        auxiliaryDoc,
      },
    ];
    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, debit: amounts.igvAmount });
    }
    lines.push({
      accountId: payableAccountId,
      credit: amounts.totalAmount,
      auxiliaryRuc: supplier.ruc,
      auxiliaryDoc,
    });

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.issueDate,
        description,
        lines,
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadPurchaseDebitNote.create({
      data: {
        applicationId,
        supplierId: input.supplierId,
        invoiceId: input.invoiceId ?? null,
        periodId: input.periodId,
        series: input.series.trim().toUpperCase(),
        number: input.number.trim(),
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        reason: input.reason?.trim() || null,
        status: CONTABILIDAD_PURCHASE_DEBIT_NOTE_STATUS.ACTIVE,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: debitNoteInclude,
    });

    return ContabilidadPurchasesPrismaMapper.toDebitNote(row);
  }

  async listPayments(
    applicationId: string,
    filters: ListPurchasePaymentsFilters,
  ): Promise<ContabilidadPurchasePaymentDto[]> {
    const rows = await this.prisma.contabilidadPurchasePayment.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.invoiceId ? { invoiceId: filters.invoiceId } : {}),
        ...(filters.supplierId ? { invoice: { supplierId: filters.supplierId } } : {}),
      },
      include: paymentInclude,
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadPurchasesPrismaMapper.toPayment(row));
  }

  async createPaymentWithTreasury(
    applicationId: string,
    input: CreatePurchasePaymentInput,
    payableAccountId: string,
    createdBy?: string | null,
  ): Promise<ContabilidadPurchasePaymentDto> {
    const invoice = await this.prisma.contabilidadPurchaseInvoice.findFirst({
      where: { applicationId, id: input.invoiceId },
      include: { supplier: true },
    });
    if (!invoice) throw new Error('Factura no encontrada');
    if (invoice.status === CONTABILIDAD_PURCHASE_STATUS.CANCELLED) throw new Error('Factura anulada');
    if (invoice.status === CONTABILIDAD_PURCHASE_STATUS.PAID) throw new Error('Factura ya pagada');

    const amount = roundPenAmount(parsePenAmount(input.amount));
    const balance = roundPenAmount(Number(invoice.totalAmount) - Number(invoice.paidAmount));
    if (amount <= 0) throw new Error('Importe inválido');
    if (amount > balance) throw new Error('El pago supera el saldo pendiente');

    const movement = await this.treasury.createMovementWithJournal(
      applicationId,
      {
        periodId: input.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.OUT,
        sourceType: input.sourceType,
        cashBoxId: input.cashBoxId,
        bankAccountId: input.bankAccountId,
        offsetAccountId: payableAccountId,
        amount,
        movementDate: input.paymentDate,
        description: input.description.trim(),
      },
      createdBy,
    );

    const newPaid = roundPenAmount(Number(invoice.paidAmount) + amount);
    const newBalance = roundPenAmount(Number(invoice.totalAmount) - newPaid);
    const newStatus =
      newBalance <= 0
        ? CONTABILIDAD_PURCHASE_STATUS.PAID
        : newPaid > 0
          ? CONTABILIDAD_PURCHASE_STATUS.PARTIAL
          : CONTABILIDAD_PURCHASE_STATUS.PENDING;

    await this.prisma.contabilidadPurchaseInvoice.update({
      where: { id: invoice.id },
      data: { paidAmount: newPaid, status: newStatus },
    });

    const row = await this.prisma.contabilidadPurchasePayment.create({
      data: {
        applicationId,
        invoiceId: invoice.id,
        periodId: input.periodId,
        amount,
        paymentDate: parseDateOnly(input.paymentDate),
        description: input.description.trim(),
        sourceType: input.sourceType,
        cashBoxId: input.sourceType === 'CASH' ? input.cashBoxId : null,
        bankAccountId: input.sourceType === 'BANK' ? input.bankAccountId : null,
        treasuryMovementId: movement.id,
        createdBy: createdBy ?? null,
      },
      include: paymentInclude,
    });

    return ContabilidadPurchasesPrismaMapper.toPayment(row);
  }
}
