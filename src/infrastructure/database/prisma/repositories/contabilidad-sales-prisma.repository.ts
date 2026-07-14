import { Inject, Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_ACCOUNT_REPOSITORY,
  CONTABILIDAD_JOURNAL_REPOSITORY,
  CONTABILIDAD_TREASURY_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE,
  CONTABILIDAD_SALES_CREDIT_NOTE_STATUS,
  CONTABILIDAD_SALES_DEBIT_NOTE_STATUS,
  CONTABILIDAD_SALES_IGV_ACCOUNT_CODE,
  CONTABILIDAD_SALES_STATUS,
  CONTABILIDAD_SALES_TAX_AFFECTATION,
} from '@domain/constants/contabilidad-sales.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadAccountRepository } from '@domain/repositories/contabilidad-account.repository';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  ContabilidadCustomerDto,
  ContabilidadSalesCollectionDto,
  ContabilidadSalesCreditNoteDto,
  ContabilidadSalesDebitNoteDto,
  ContabilidadSalesInvoiceDto,
  ContabilidadSalesRepository,
  CreateCustomerInput,
  CreateSalesCollectionInput,
  CreateSalesCreditNoteInput,
  CreateSalesDebitNoteInput,
  CreateSalesInvoiceInput,
  ListCustomersFilters,
  ListSalesCollectionsFilters,
  ListSalesCreditNotesFilters,
  ListSalesDebitNotesFilters,
  ListSalesInvoicesFilters,
  UpdateCustomerInput,
} from '@domain/repositories/contabilidad-sales.repository';
import type { ContabilidadTreasuryRepository } from '@domain/repositories/contabilidad-treasury.repository';
import { parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { parseDateOnly } from '@domain/utils/peru-date.util';
import { resolveInvoiceTaxableBaseInPen } from '../helpers/contabilidad-invoice-multicurrency.helper';
import { PrismaService } from '../prisma.service';
import { ContabilidadSalesPrismaMapper } from '../mappers/contabilidad-sales-prisma.mapper';

const customerInclude = {
  invoices: {
    where: { status: { not: CONTABILIDAD_SALES_STATUS.CANCELLED } },
    select: { totalAmount: true, collectedAmount: true },
  },
  creditNotes: {
    where: { status: CONTABILIDAD_SALES_CREDIT_NOTE_STATUS.ACTIVE },
    select: { totalAmount: true },
  },
  debitNotes: {
    where: { status: CONTABILIDAD_SALES_DEBIT_NOTE_STATUS.ACTIVE },
    select: { totalAmount: true },
  },
} as const;

const debitNoteInclude = {
  customer: { select: { ruc: true, businessName: true } },
  invoice: { select: { series: true, number: true } },
} as const;

const invoiceInclude = {
  customer: { select: { ruc: true, businessName: true } },
  incomeAccount: { select: { code: true, name: true } },
} as const;

const creditNoteInclude = {
  customer: { select: { ruc: true, businessName: true } },
  invoice: { select: { series: true, number: true } },
} as const;

const collectionInclude = {
  invoice: {
    select: {
      series: true,
      number: true,
      customer: { select: { ruc: true, businessName: true } },
    },
  },
  cashBox: { select: { code: true } },
  bankAccount: { select: { code: true } },
  treasuryMovement: { select: { journalEntryId: true } },
} as const;

function computeCustomerBalance(
  invoices: { totalAmount: { toString(): string } | number; collectedAmount: { toString(): string } | number }[],
  creditNotes: { totalAmount: { toString(): string } | number }[],
  debitNotes: { totalAmount: { toString(): string } | number }[],
): number {
  const invoiceBalance = invoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(inv.totalAmount) - Number(inv.collectedAmount)),
    0,
  );
  const creditTotal = creditNotes.reduce((sum, nc) => sum + Number(nc.totalAmount), 0);
  const debitTotal = debitNotes.reduce((sum, nd) => sum + Number(nd.totalAmount), 0);
  return roundPenAmount(Math.max(0, invoiceBalance - creditTotal + debitTotal));
}

function computeSalesAmounts(
  taxableBase: number | string,
  taxAffectation: string,
  igvPercent: number,
  igvAmountInput?: number | string,
) {
  const base = roundPenAmount(parsePenAmount(taxableBase));
  if (taxAffectation === CONTABILIDAD_SALES_TAX_AFFECTATION.TAXABLE) {
    const igv =
      igvAmountInput !== undefined && igvAmountInput !== ''
        ? roundPenAmount(parsePenAmount(igvAmountInput))
        : roundPenAmount((base * igvPercent) / 100);
    return { taxableBase: base, igvAmount: igv, totalAmount: roundPenAmount(base + igv) };
  }
  return { taxableBase: base, igvAmount: 0, totalAmount: base };
}

@Injectable()
export class ContabilidadSalesPrismaRepository implements ContabilidadSalesRepository {
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

  async listCustomers(applicationId: string, filters: ListCustomersFilters): Promise<ContabilidadCustomerDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadCustomer.findMany({
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
      include: customerInclude,
      orderBy: [{ businessName: 'asc' }],
    });
    return rows.map((row) =>
      ContabilidadSalesPrismaMapper.toCustomer(
        row,
        computeCustomerBalance(row.invoices, row.creditNotes, row.debitNotes),
        row.invoices.length,
      ),
    );
  }

  async findCustomerById(applicationId: string, id: string): Promise<ContabilidadCustomerDto | null> {
    const row = await this.prisma.contabilidadCustomer.findFirst({
      where: { applicationId, id },
      include: customerInclude,
    });
    if (!row) return null;
    return ContabilidadSalesPrismaMapper.toCustomer(
      row,
      computeCustomerBalance(row.invoices, row.creditNotes, row.debitNotes),
      row.invoices.length,
    );
  }

  async createCustomer(applicationId: string, input: CreateCustomerInput): Promise<ContabilidadCustomerDto> {
    const row = await this.prisma.contabilidadCustomer.create({
      data: {
        applicationId,
        ruc: input.ruc.trim(),
        businessName: input.businessName.trim(),
        tradeName: input.tradeName?.trim() || null,
        address: input.address?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      },
      include: customerInclude,
    });
    return ContabilidadSalesPrismaMapper.toCustomer(row, 0, 0);
  }

  async updateCustomer(
    applicationId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<ContabilidadCustomerDto> {
    const row = await this.prisma.contabilidadCustomer.update({
      where: { id },
      data: {
        ...(input.businessName !== undefined ? { businessName: input.businessName.trim() } : {}),
        ...(input.tradeName !== undefined ? { tradeName: input.tradeName?.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
        ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: customerInclude,
    });
    if (row.applicationId !== applicationId) throw new Error('Cliente no encontrado');
    return ContabilidadSalesPrismaMapper.toCustomer(
      row,
      computeCustomerBalance(row.invoices, row.creditNotes, row.debitNotes),
      row.invoices.length,
    );
  }

  async listInvoices(
    applicationId: string,
    filters: ListSalesInvoicesFilters,
  ): Promise<ContabilidadSalesInvoiceDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadSalesInvoice.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.documentType ? { documentType: filters.documentType } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { customer: { businessName: { contains: q, mode: 'insensitive' } } },
                { customer: { ruc: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: invoiceInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadSalesPrismaMapper.toInvoice(row));
  }

  async findInvoiceById(applicationId: string, id: string): Promise<ContabilidadSalesInvoiceDto | null> {
    const row = await this.prisma.contabilidadSalesInvoice.findFirst({
      where: { applicationId, id },
      include: invoiceInclude,
    });
    return row ? ContabilidadSalesPrismaMapper.toInvoice(row) : null;
  }

  async createInvoiceWithJournal(
    applicationId: string,
    input: CreateSalesInvoiceInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesInvoiceDto> {
    const customer = await this.prisma.contabilidadCustomer.findFirst({
      where: { applicationId, id: input.customerId, isActive: true },
    });
    if (!customer) throw new Error('Cliente no encontrado');

    const fx = await resolveInvoiceTaxableBaseInPen(this.prisma, applicationId, {
      currencyCode: input.currencyCode,
      exchangeRate: input.exchangeRate,
      foreignTaxableBase: input.foreignTaxableBase,
      taxableBase: input.taxableBase,
      issueDate: input.issueDate,
    });
    const amounts = computeSalesAmounts(fx.taxableBasePen, input.taxAffectation, igvPercent, input.igvAmount);
    const receivableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `Venta ${auxiliaryDoc} — ${customer.businessName}`;

    const lines: {
      accountId: string;
      debit?: number;
      credit?: number;
      auxiliaryRuc?: string;
      auxiliaryDoc?: string;
    }[] = [
      {
        accountId: receivableAccountId,
        debit: amounts.totalAmount,
        auxiliaryRuc: customer.ruc,
        auxiliaryDoc,
      },
      {
        accountId: input.incomeAccountId,
        credit: amounts.taxableBase,
        auxiliaryRuc: customer.ruc,
        auxiliaryDoc,
      },
    ];

    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_SALES_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, credit: amounts.igvAmount });
    }

    const journal = await this.journal.createAndPost(
      applicationId,
      { periodId: input.periodId, entryDate: input.issueDate, description, lines },
      createdBy,
    );

    const row = await this.prisma.contabilidadSalesInvoice.create({
      data: {
        applicationId,
        customerId: input.customerId,
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
        incomeAccountId: input.incomeAccountId,
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        collectedAmount: 0,
        status: CONTABILIDAD_SALES_STATUS.PENDING,
        notes: input.notes?.trim() || null,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: invoiceInclude,
    });

    return ContabilidadSalesPrismaMapper.toInvoice(row);
  }

  async cancelInvoice(applicationId: string, id: string): Promise<ContabilidadSalesInvoiceDto> {
    const existing = await this.prisma.contabilidadSalesInvoice.findFirst({ where: { applicationId, id } });
    if (!existing) throw new Error('Comprobante no encontrado');
    if (existing.status === CONTABILIDAD_SALES_STATUS.CANCELLED) throw new Error('Comprobante ya anulado');
    if (Number(existing.collectedAmount) > 0) throw new Error('No se puede anular un comprobante con cobros');

    const row = await this.prisma.contabilidadSalesInvoice.update({
      where: { id },
      data: { status: CONTABILIDAD_SALES_STATUS.CANCELLED, cancelledAt: new Date() },
      include: invoiceInclude,
    });
    return ContabilidadSalesPrismaMapper.toInvoice(row);
  }

  async listCreditNotes(
    applicationId: string,
    filters: ListSalesCreditNotesFilters,
  ): Promise<ContabilidadSalesCreditNoteDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadSalesCreditNote.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { customer: { businessName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: creditNoteInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadSalesPrismaMapper.toCreditNote(row));
  }

  async createCreditNoteWithJournal(
    applicationId: string,
    input: CreateSalesCreditNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesCreditNoteDto> {
    const customer = await this.prisma.contabilidadCustomer.findFirst({
      where: { applicationId, id: input.customerId, isActive: true },
    });
    if (!customer) throw new Error('Cliente no encontrado');

    let incomeAccountId: string | null = null;
    if (input.invoiceId) {
      const invoice = await this.prisma.contabilidadSalesInvoice.findFirst({
        where: { applicationId, id: input.invoiceId, customerId: input.customerId },
      });
      if (!invoice) throw new Error('Factura vinculada no encontrada');
      incomeAccountId = invoice.incomeAccountId;
    }
    if (!incomeAccountId) {
      incomeAccountId = await this.resolveAccountId(applicationId, '701');
    }

    const amounts = computeSalesAmounts(
      input.taxableBase,
      CONTABILIDAD_SALES_TAX_AFFECTATION.TAXABLE,
      igvPercent,
      input.igvAmount,
    );
    const receivableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `NC venta ${auxiliaryDoc} — ${customer.businessName}`;

    const lines: { accountId: string; debit?: number; credit?: number; auxiliaryRuc?: string; auxiliaryDoc?: string }[] = [
      { accountId: incomeAccountId, debit: amounts.taxableBase, auxiliaryRuc: customer.ruc, auxiliaryDoc },
    ];
    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_SALES_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, debit: amounts.igvAmount });
    }
    lines.push({
      accountId: receivableAccountId,
      credit: amounts.totalAmount,
      auxiliaryRuc: customer.ruc,
      auxiliaryDoc,
    });

    const journal = await this.journal.createAndPost(
      applicationId,
      { periodId: input.periodId, entryDate: input.issueDate, description, lines },
      createdBy,
    );

    const row = await this.prisma.contabilidadSalesCreditNote.create({
      data: {
        applicationId,
        customerId: input.customerId,
        invoiceId: input.invoiceId ?? null,
        periodId: input.periodId,
        series: input.series.trim().toUpperCase(),
        number: input.number.trim(),
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        reason: input.reason?.trim() || null,
        status: CONTABILIDAD_SALES_CREDIT_NOTE_STATUS.ACTIVE,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: creditNoteInclude,
    });

    return ContabilidadSalesPrismaMapper.toCreditNote(row);
  }

  async listDebitNotes(
    applicationId: string,
    filters: ListSalesDebitNotesFilters,
  ): Promise<ContabilidadSalesDebitNoteDto[]> {
    const q = filters.search?.trim();
    const rows = await this.prisma.contabilidadSalesDebitNote.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(q
          ? {
              OR: [
                { series: { contains: q, mode: 'insensitive' } },
                { number: { contains: q, mode: 'insensitive' } },
                { customer: { businessName: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: debitNoteInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadSalesPrismaMapper.toDebitNote(row));
  }

  async createDebitNoteWithJournal(
    applicationId: string,
    input: CreateSalesDebitNoteInput,
    igvPercent: number,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesDebitNoteDto> {
    const customer = await this.prisma.contabilidadCustomer.findFirst({
      where: { applicationId, id: input.customerId, isActive: true },
    });
    if (!customer) throw new Error('Cliente no encontrado');

    let incomeAccountId: string | null = null;
    if (input.invoiceId) {
      const invoice = await this.prisma.contabilidadSalesInvoice.findFirst({
        where: { applicationId, id: input.invoiceId, customerId: input.customerId },
      });
      if (!invoice) throw new Error('Factura vinculada no encontrada');
      incomeAccountId = invoice.incomeAccountId;
    }
    if (!incomeAccountId) {
      incomeAccountId = await this.resolveAccountId(applicationId, '701');
    }

    const amounts = computeSalesAmounts(
      input.taxableBase,
      CONTABILIDAD_SALES_TAX_AFFECTATION.TAXABLE,
      igvPercent,
      input.igvAmount,
    );
    const receivableAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE);
    const auxiliaryDoc = `${input.series.trim()}-${input.number.trim()}`;
    const description = `ND venta ${auxiliaryDoc} — ${customer.businessName}`;

    const lines: { accountId: string; debit?: number; credit?: number; auxiliaryRuc?: string; auxiliaryDoc?: string }[] = [
      {
        accountId: receivableAccountId,
        debit: amounts.totalAmount,
        auxiliaryRuc: customer.ruc,
        auxiliaryDoc,
      },
      {
        accountId: incomeAccountId,
        credit: amounts.taxableBase,
        auxiliaryRuc: customer.ruc,
        auxiliaryDoc,
      },
    ];
    if (amounts.igvAmount > 0) {
      const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_SALES_IGV_ACCOUNT_CODE);
      lines.push({ accountId: igvAccountId, credit: amounts.igvAmount });
    }

    const journal = await this.journal.createAndPost(
      applicationId,
      { periodId: input.periodId, entryDate: input.issueDate, description, lines },
      createdBy,
    );

    const row = await this.prisma.contabilidadSalesDebitNote.create({
      data: {
        applicationId,
        customerId: input.customerId,
        invoiceId: input.invoiceId ?? null,
        periodId: input.periodId,
        series: input.series.trim().toUpperCase(),
        number: input.number.trim(),
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: amounts.taxableBase,
        igvAmount: amounts.igvAmount,
        totalAmount: amounts.totalAmount,
        reason: input.reason?.trim() || null,
        status: CONTABILIDAD_SALES_DEBIT_NOTE_STATUS.ACTIVE,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: debitNoteInclude,
    });

    return ContabilidadSalesPrismaMapper.toDebitNote(row);
  }

  async listCollections(
    applicationId: string,
    filters: ListSalesCollectionsFilters,
  ): Promise<ContabilidadSalesCollectionDto[]> {
    const rows = await this.prisma.contabilidadSalesCollection.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.invoiceId ? { invoiceId: filters.invoiceId } : {}),
        ...(filters.customerId ? { invoice: { customerId: filters.customerId } } : {}),
      },
      include: collectionInclude,
      orderBy: [{ collectionDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadSalesPrismaMapper.toCollection(row));
  }

  async createCollectionWithTreasury(
    applicationId: string,
    input: CreateSalesCollectionInput,
    receivableAccountId: string,
    createdBy?: string | null,
  ): Promise<ContabilidadSalesCollectionDto> {
    const invoice = await this.prisma.contabilidadSalesInvoice.findFirst({
      where: { applicationId, id: input.invoiceId },
      include: { customer: true },
    });
    if (!invoice) throw new Error('Comprobante no encontrado');
    if (invoice.status === CONTABILIDAD_SALES_STATUS.CANCELLED) throw new Error('Comprobante anulado');
    if (invoice.status === CONTABILIDAD_SALES_STATUS.PAID) throw new Error('Comprobante ya cobrado');

    const amount = roundPenAmount(parsePenAmount(input.amount));
    const balance = roundPenAmount(Number(invoice.totalAmount) - Number(invoice.collectedAmount));
    if (amount <= 0) throw new Error('Importe inválido');
    if (amount > balance) throw new Error('El cobro supera el saldo pendiente');

    const movement = await this.treasury.createMovementWithJournal(
      applicationId,
      {
        periodId: input.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN,
        sourceType: input.sourceType,
        cashBoxId: input.cashBoxId,
        bankAccountId: input.bankAccountId,
        offsetAccountId: receivableAccountId,
        amount,
        movementDate: input.collectionDate,
        description: input.description.trim(),
      },
      createdBy,
    );

    const newCollected = roundPenAmount(Number(invoice.collectedAmount) + amount);
    const newBalance = roundPenAmount(Number(invoice.totalAmount) - newCollected);
    const newStatus =
      newBalance <= 0
        ? CONTABILIDAD_SALES_STATUS.PAID
        : newCollected > 0
          ? CONTABILIDAD_SALES_STATUS.PARTIAL
          : CONTABILIDAD_SALES_STATUS.PENDING;

    await this.prisma.contabilidadSalesInvoice.update({
      where: { id: invoice.id },
      data: { collectedAmount: newCollected, status: newStatus },
    });

    const row = await this.prisma.contabilidadSalesCollection.create({
      data: {
        applicationId,
        invoiceId: invoice.id,
        periodId: input.periodId,
        amount,
        collectionDate: parseDateOnly(input.collectionDate),
        description: input.description.trim(),
        sourceType: input.sourceType,
        cashBoxId: input.sourceType === 'CASH' ? input.cashBoxId : null,
        bankAccountId: input.sourceType === 'BANK' ? input.bankAccountId : null,
        treasuryMovementId: movement.id,
        createdBy: createdBy ?? null,
      },
      include: collectionInclude,
    });

    return ContabilidadSalesPrismaMapper.toCollection(row);
  }
}
