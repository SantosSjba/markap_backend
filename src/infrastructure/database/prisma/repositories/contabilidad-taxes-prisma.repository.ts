import { Inject, Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_ACCOUNT_REPOSITORY,
  CONTABILIDAD_JOURNAL_REPOSITORY,
  CONTABILIDAD_TREASURY_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_DEFAULT_DETRACTION_RATES,
  CONTABILIDAD_DETRACTION_ACCOUNT_CODE,
  CONTABILIDAD_DETRACTION_STATUS,
  CONTABILIDAD_IGV_ACCOUNT_CODE,
  CONTABILIDAD_PAYABLE_ACCOUNT_CODE,
  CONTABILIDAD_RETENTION_ACCOUNT_CODE,
  CONTABILIDAD_TAX_RECORD_STATUS,
} from '@domain/constants/contabilidad-taxes.defaults';
import { CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS, CONTABILIDAD_PURCHASE_STATUS } from '@domain/constants/contabilidad-purchases.defaults';
import { CONTABILIDAD_SALES_CREDIT_NOTE_STATUS, CONTABILIDAD_SALES_STATUS } from '@domain/constants/contabilidad-sales.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE, CONTABILIDAD_TREASURY_SOURCE_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadAccountRepository } from '@domain/repositories/contabilidad-account.repository';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  ContabilidadDetraccionDto,
  ContabilidadDetraccionRateDto,
  ContabilidadIgvSummaryDto,
  ContabilidadPerceptionDto,
  ContabilidadPdt621ExportDto,
  ContabilidadRetentionDto,
  ContabilidadTaxesRepository,
  CreateDetraccionInput,
  CreatePerceptionInput,
  CreateRetentionInput,
  PayDetraccionInput,
} from '@domain/repositories/contabilidad-taxes.repository';
import type { ContabilidadTreasuryRepository } from '@domain/repositories/contabilidad-treasury.repository';
import { parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { parseDateOnly } from '@domain/utils/peru-date.util';
import { PrismaService } from '../prisma.service';
import { ContabilidadTaxesPrismaMapper } from '../mappers/contabilidad-taxes-prisma.mapper';

const detraccionInclude = {
  purchaseInvoice: { select: { series: true, number: true } },
  rate: { select: { description: true } },
} as const;

const perceptionInclude = {
  salesInvoice: { select: { series: true, number: true } },
} as const;

function sumDecimal(rows: { _sum: { amount?: { toString(): string } | number | null; igvAmount?: { toString(): string } | number | null } }) {
  const val = rows._sum.amount ?? rows._sum.igvAmount ?? 0;
  return Number(val);
}

@Injectable()
export class ContabilidadTaxesPrismaRepository implements ContabilidadTaxesRepository {
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

  async ensureDefaults(applicationId: string): Promise<void> {
    const existing = await this.prisma.contabilidadDetraccionRate.count({ where: { applicationId } });
    if (existing > 0) return;
    await this.prisma.contabilidadDetraccionRate.createMany({
      data: CONTABILIDAD_DEFAULT_DETRACTION_RATES.map((r) => ({
        applicationId,
        sunatCode: r.sunatCode,
        description: r.description,
        ratePercent: r.ratePercent,
        minAmount: r.minAmount,
      })),
    });
  }

  async getIgvSummary(applicationId: string, periodId: string, igvPercent: number): Promise<ContabilidadIgvSummaryDto> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { id: periodId, applicationId },
    });
    if (!period) throw new Error('Periodo no encontrado');

    const [purchaseIgv, purchaseNcIgv, salesIgv, salesNcIgv, retentions, perceptions] = await Promise.all([
      this.prisma.contabilidadPurchaseInvoice.aggregate({
        where: {
          applicationId,
          periodId,
          status: { not: CONTABILIDAD_PURCHASE_STATUS.CANCELLED },
        },
        _sum: { igvAmount: true },
      }),
      this.prisma.contabilidadPurchaseCreditNote.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS.ACTIVE },
        _sum: { igvAmount: true },
      }),
      this.prisma.contabilidadSalesInvoice.aggregate({
        where: {
          applicationId,
          periodId,
          status: { not: CONTABILIDAD_SALES_STATUS.CANCELLED },
        },
        _sum: { igvAmount: true },
      }),
      this.prisma.contabilidadSalesCreditNote.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_SALES_CREDIT_NOTE_STATUS.ACTIVE },
        _sum: { igvAmount: true },
      }),
      this.prisma.contabilidadRetention.aggregate({
        where: {
          applicationId,
          periodId,
          status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE,
          retentionType: 'IGV',
        },
        _sum: { amount: true },
      }),
      this.prisma.contabilidadPerception.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE },
        _sum: { amount: true },
      }),
    ]);

    const purchaseCreditIgv = roundPenAmount(sumDecimal(purchaseIgv));
    const purchaseCreditNoteIgv = roundPenAmount(sumDecimal(purchaseNcIgv));
    const salesDebitIgv = roundPenAmount(sumDecimal(salesIgv));
    const salesCreditNoteIgv = roundPenAmount(sumDecimal(salesNcIgv));
    const retentionsIgv = roundPenAmount(sumDecimal(retentions));
    const perceptionsIgv = roundPenAmount(sumDecimal(perceptions));

    const netCreditIgv = roundPenAmount(purchaseCreditIgv - purchaseCreditNoteIgv + retentionsIgv);
    const netDebitIgv = roundPenAmount(salesDebitIgv - salesCreditNoteIgv + perceptionsIgv);
    const balance = roundPenAmount(netDebitIgv - netCreditIgv);

    return {
      periodId,
      year: period.year,
      month: period.month,
      igvPercent,
      purchaseCreditIgv: purchaseCreditIgv.toFixed(2),
      purchaseCreditNoteIgv: purchaseCreditNoteIgv.toFixed(2),
      salesDebitIgv: salesDebitIgv.toFixed(2),
      salesCreditNoteIgv: salesCreditNoteIgv.toFixed(2),
      retentionsIgv: retentionsIgv.toFixed(2),
      perceptionsIgv: perceptionsIgv.toFixed(2),
      netCreditIgv: netCreditIgv.toFixed(2),
      netDebitIgv: netDebitIgv.toFixed(2),
      balanceToPay: balance > 0 ? balance.toFixed(2) : '0.00',
      balanceInFavor: balance < 0 ? Math.abs(balance).toFixed(2) : '0.00',
    };
  }

  async getPdt621Export(
    applicationId: string,
    periodId: string,
    company: { ruc: string; legalName: string },
    igvPercent: number,
  ): Promise<ContabilidadPdt621ExportDto> {
    const igvSummary = await this.getIgvSummary(applicationId, periodId, igvPercent);
    const [detracciones, retenciones, percepciones] = await Promise.all([
      this.prisma.contabilidadDetraccion.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_DETRACTION_STATUS.PAID },
        _sum: { amount: true },
      }),
      this.prisma.contabilidadRetention.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE },
        _sum: { amount: true },
      }),
      this.prisma.contabilidadPerception.aggregate({
        where: { applicationId, periodId, status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE },
        _sum: { amount: true },
      }),
    ]);

    return {
      periodId,
      year: igvSummary.year,
      month: igvSummary.month,
      ruc: company.ruc,
      legalName: company.legalName,
      igvSummary,
      detraccionesTotal: roundPenAmount(sumDecimal(detracciones)).toFixed(2),
      retencionesTotal: roundPenAmount(sumDecimal(retenciones)).toFixed(2),
      percepcionesTotal: roundPenAmount(sumDecimal(percepciones)).toFixed(2),
      generatedAt: new Date().toISOString(),
    };
  }

  async listDetraccionRates(applicationId: string): Promise<ContabilidadDetraccionRateDto[]> {
    await this.ensureDefaults(applicationId);
    const rows = await this.prisma.contabilidadDetraccionRate.findMany({
      where: { applicationId, isActive: true },
      orderBy: { sunatCode: 'asc' },
    });
    return rows.map(ContabilidadTaxesPrismaMapper.toDetraccionRate);
  }

  async listDetracciones(
    applicationId: string,
    filters: { periodId?: string; status?: string },
  ): Promise<ContabilidadDetraccionDto[]> {
    const rows = await this.prisma.contabilidadDetraccion.findMany({
      where: {
        applicationId,
        periodId: filters.periodId,
        status: filters.status || undefined,
      },
      include: detraccionInclude,
      orderBy: { operationDate: 'desc' },
    });
    return rows.map(ContabilidadTaxesPrismaMapper.toDetraccion);
  }

  async createDetraccion(
    applicationId: string,
    input: CreateDetraccionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadDetraccionDto> {
    const base = roundPenAmount(parsePenAmount(input.baseAmount));
    let ratePercent = input.ratePercent !== undefined ? Number(input.ratePercent) : 0;
    if (input.rateId) {
      const rate = await this.prisma.contabilidadDetraccionRate.findFirst({
        where: { id: input.rateId, applicationId },
      });
      if (!rate) throw new Error('Tasa de detracción no encontrada');
      ratePercent = Number(rate.ratePercent);
    }
    const amount =
      input.amount !== undefined && input.amount !== ''
        ? roundPenAmount(parsePenAmount(input.amount))
        : roundPenAmount((base * ratePercent) / 100);
    if (amount <= 0) throw new Error('Importe de detracción inválido');

    const payableId = await this.resolveAccountId(applicationId, CONTABILIDAD_PAYABLE_ACCOUNT_CODE);
    const detraccionAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_DETRACTION_ACCOUNT_CODE);

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.operationDate,
        description: `Detracción SPOT ${input.certificateNumber} — ${input.supplierName}`,
        lines: [
          { accountId: payableId, debit: amount, auxiliaryRuc: input.supplierRuc },
          { accountId: detraccionAccountId, credit: amount },
        ],
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadDetraccion.create({
      data: {
        applicationId,
        periodId: input.periodId,
        purchaseInvoiceId: input.purchaseInvoiceId ?? null,
        rateId: input.rateId ?? null,
        supplierRuc: input.supplierRuc.trim(),
        supplierName: input.supplierName.trim(),
        certificateNumber: input.certificateNumber.trim(),
        operationDate: parseDateOnly(input.operationDate),
        baseAmount: base,
        ratePercent,
        amount,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: detraccionInclude,
    });
    return ContabilidadTaxesPrismaMapper.toDetraccion(row);
  }

  async payDetraccion(
    applicationId: string,
    id: string,
    input: PayDetraccionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadDetraccionDto> {
    const existing = await this.prisma.contabilidadDetraccion.findFirst({
      where: { id, applicationId },
    });
    if (!existing) throw new Error('Detracción no encontrada');
    if (existing.status === CONTABILIDAD_DETRACTION_STATUS.PAID) throw new Error('Detracción ya pagada');

    const detraccionAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_DETRACTION_ACCOUNT_CODE);
    const movement = await this.treasury.createMovementWithJournal(
      applicationId,
      {
        periodId: existing.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.OUT,
        sourceType: input.sourceType,
        cashBoxId: input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH ? input.cashBoxId : null,
        bankAccountId: input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK ? input.bankAccountId : null,
        offsetAccountId: detraccionAccountId,
        amount: Number(existing.amount),
        movementDate: input.paymentDate,
        description: input.description.trim(),
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadDetraccion.update({
      where: { id },
      data: {
        status: CONTABILIDAD_DETRACTION_STATUS.PAID,
        paidAt: new Date(),
        treasuryMovementId: movement.id,
      },
      include: detraccionInclude,
    });
    return ContabilidadTaxesPrismaMapper.toDetraccion(row);
  }

  async listRetentions(
    applicationId: string,
    filters: { periodId?: string; retentionType?: string },
  ): Promise<ContabilidadRetentionDto[]> {
    const rows = await this.prisma.contabilidadRetention.findMany({
      where: {
        applicationId,
        periodId: filters.periodId,
        retentionType: filters.retentionType || undefined,
        status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE,
      },
      orderBy: { issueDate: 'desc' },
    });
    return rows.map(ContabilidadTaxesPrismaMapper.toRetention);
  }

  async createRetention(
    applicationId: string,
    input: CreateRetentionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadRetentionDto> {
    const base = roundPenAmount(parsePenAmount(input.taxableBase));
    const ratePercent = input.ratePercent !== undefined ? Number(input.ratePercent) : 0;
    const amount =
      input.amount !== undefined && input.amount !== ''
        ? roundPenAmount(parsePenAmount(input.amount))
        : roundPenAmount((base * ratePercent) / 100);
    if (amount <= 0) throw new Error('Importe de retención inválido');

    const payableId = await this.resolveAccountId(applicationId, CONTABILIDAD_PAYABLE_ACCOUNT_CODE);
    const retentionAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_RETENTION_ACCOUNT_CODE);

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.issueDate,
        description: `Retención ${input.retentionType} — ${input.counterpartyName}`,
        lines: [
          { accountId: payableId, debit: amount, auxiliaryRuc: input.counterpartyRuc },
          { accountId: retentionAccountId, credit: amount },
        ],
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadRetention.create({
      data: {
        applicationId,
        periodId: input.periodId,
        retentionType: input.retentionType,
        counterpartyRuc: input.counterpartyRuc.trim(),
        counterpartyName: input.counterpartyName.trim(),
        documentType: input.documentType ?? null,
        documentSeries: input.documentSeries ?? null,
        documentNumber: input.documentNumber ?? null,
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: base,
        ratePercent,
        amount,
        purchaseInvoiceId: input.purchaseInvoiceId ?? null,
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
    });
    return ContabilidadTaxesPrismaMapper.toRetention(row);
  }

  async listPerceptions(
    applicationId: string,
    filters: { periodId?: string },
  ): Promise<ContabilidadPerceptionDto[]> {
    const rows = await this.prisma.contabilidadPerception.findMany({
      where: {
        applicationId,
        periodId: filters.periodId,
        status: CONTABILIDAD_TAX_RECORD_STATUS.ACTIVE,
      },
      include: perceptionInclude,
      orderBy: { issueDate: 'desc' },
    });
    return rows.map(ContabilidadTaxesPrismaMapper.toPerception);
  }

  async createPerception(
    applicationId: string,
    input: CreatePerceptionInput,
    createdBy?: string | null,
  ): Promise<ContabilidadPerceptionDto> {
    const base = roundPenAmount(parsePenAmount(input.taxableBase));
    const ratePercent = input.ratePercent !== undefined ? Number(input.ratePercent) : 0;
    const amount =
      input.amount !== undefined && input.amount !== ''
        ? roundPenAmount(parsePenAmount(input.amount))
        : roundPenAmount((base * ratePercent) / 100);
    if (amount <= 0) throw new Error('Importe de percepción inválido');

    const igvAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_IGV_ACCOUNT_CODE);
    const movement = await this.treasury.createMovementWithJournal(
      applicationId,
      {
        periodId: input.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN,
        sourceType: input.sourceType,
        cashBoxId: input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH ? input.cashBoxId : null,
        bankAccountId: input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK ? input.bankAccountId : null,
        offsetAccountId: igvAccountId,
        amount,
        movementDate: input.issueDate,
        description: input.description.trim(),
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadPerception.create({
      data: {
        applicationId,
        periodId: input.periodId,
        perceptionType: input.perceptionType,
        customerRuc: input.customerRuc.trim(),
        customerName: input.customerName.trim(),
        salesInvoiceId: input.salesInvoiceId ?? null,
        issueDate: parseDateOnly(input.issueDate),
        taxableBase: base,
        ratePercent,
        amount,
        treasuryMovementId: movement.id,
        journalEntryId: movement.journalEntryId,
        createdBy: createdBy ?? null,
      },
      include: perceptionInclude,
    });
    return ContabilidadTaxesPrismaMapper.toPerception(row);
  }
}
