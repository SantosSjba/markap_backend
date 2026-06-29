import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import type {
  ContabilidadJournalEntryDetailDto,
  ContabilidadJournalEntryListItemDto,
  ContabilidadJournalLineInput,
  ContabilidadJournalRepository,
  CreateContabilidadJournalEntryInput,
  ListContabilidadJournalEntriesFilters,
  UpdateContabilidadJournalEntryInput,
} from '@domain/repositories/contabilidad-journal.repository';
import {
  convertForeignToPen,
  FUNCTIONAL_CURRENCY,
  normalizeCurrencyCode,
  parseExchangeRate,
} from '@domain/utils/contabilidad-multicurrency.util';
import {
  amountsBalanced,
  parsePenAmount,
  roundPenAmount,
} from '@domain/utils/contabilidad-journal-amounts';
import { PrismaService } from '../prisma.service';
import { ContabilidadJournalPrismaMapper } from '../mappers/contabilidad-journal-prisma.mapper';

const lineInclude = {
  account: { select: { code: true, name: true } },
  costCenter: { select: { code: true, name: true } },
} as const;

const detailInclude = {
  lines: { orderBy: { lineNumber: 'asc' as const }, include: lineInclude },
  _count: { select: { lines: true } },
} as const;

interface NormalizedLine {
  accountId: string;
  debit: number;
  credit: number;
  foreignCurrency: string | null;
  foreignAmount: number | null;
  exchangeRate: number | null;
  costCenterId: string | null;
  auxiliaryRuc: string | null;
  auxiliaryDoc: string | null;
  description: string | null;
}

@Injectable()
export class ContabilidadJournalPrismaRepository implements ContabilidadJournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    applicationId: string,
    filters: ListContabilidadJournalEntriesFilters,
  ): Promise<ContabilidadJournalEntryListItemDto[]> {
    const where: Prisma.ContabilidadJournalEntryWhereInput = { applicationId };

    if (filters.legalEntityId) where.legalEntityId = filters.legalEntityId;
    if (filters.periodId) where.periodId = filters.periodId;
    if (filters.status) where.status = filters.status;

    if (filters.dateFrom || filters.dateTo) {
      where.entryDate = {};
      if (filters.dateFrom) where.entryDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.entryDate.lte = new Date(filters.dateTo);
    }

    const q = filters.search?.trim();
    if (q) {
      const asNumber = Number(q);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        where.OR = [
          { description: { contains: q, mode: 'insensitive' } },
          { entryNumber: asNumber },
        ];
      } else {
        where.description = { contains: q, mode: 'insensitive' };
      }
    }

    if (filters.accountId) {
      where.lines = { some: { accountId: filters.accountId } };
    }
    if (filters.costCenterId) {
      where.lines = { some: { costCenterId: filters.costCenterId } };
    }

    const rows = await this.prisma.contabilidadJournalEntry.findMany({
      where,
      include: { _count: { select: { lines: true } } },
      orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }],
    });

    return rows.map((row) => ContabilidadJournalPrismaMapper.toListItem(row));
  }

  async findById(applicationId: string, id: string): Promise<ContabilidadJournalEntryDetailDto | null> {
    const row = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { applicationId, id },
      include: detailInclude,
    });
    return row ? ContabilidadJournalPrismaMapper.toDetail(row) : null;
  }

  async createDraft(
    applicationId: string,
    input: CreateContabilidadJournalEntryInput,
    createdBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto> {
    const normalized = await this.normalizeLines(applicationId, input.lines, input.entryDate);
    const totals = this.computeTotals(normalized);
    const legalEntityId = await this.resolvePeriodLegalEntityId(applicationId, input.periodId);
    const entryNumber = await this.nextEntryNumber(legalEntityId, input.periodId);
    const entryDate = this.parseEntryDate(input.entryDate);

    const row = await this.prisma.contabilidadJournalEntry.create({
      data: {
        applicationId,
        legalEntityId,
        periodId: input.periodId,
        entryNumber,
        entryDate,
        description: input.description.trim(),
        status: CONTABILIDAD_JOURNAL_STATUS.DRAFT,
        totalDebit: totals.debit,
        totalCredit: totals.credit,
        createdBy: createdBy ?? null,
        lines: {
          create: normalized.map((line, index) => ({
            lineNumber: index + 1,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            foreignCurrency: line.foreignCurrency,
            foreignAmount: line.foreignAmount,
            exchangeRate: line.exchangeRate,
            costCenterId: line.costCenterId,
            auxiliaryRuc: line.auxiliaryRuc,
            auxiliaryDoc: line.auxiliaryDoc,
            description: line.description,
          })),
        },
      },
      include: detailInclude,
    });

    return ContabilidadJournalPrismaMapper.toDetail(row);
  }

  async updateDraft(
    applicationId: string,
    id: string,
    input: UpdateContabilidadJournalEntryInput,
  ): Promise<ContabilidadJournalEntryDetailDto> {
    const existing = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Journal entry not found');
    if (existing.status !== CONTABILIDAD_JOURNAL_STATUS.DRAFT) {
      throw new Error('Only draft entries can be updated');
    }

    const normalized = input.lines
      ? await this.normalizeLines(
          applicationId,
          input.lines,
          input.entryDate ?? existing.entryDate.toISOString().slice(0, 10),
        )
      : null;
    const totals = normalized ? this.computeTotals(normalized) : null;

    const row = await this.prisma.$transaction(async (tx) => {
      if (normalized) {
        await tx.contabilidadJournalEntryLine.deleteMany({ where: { journalEntryId: id } });
      }

      return tx.contabilidadJournalEntry.update({
        where: { id },
        data: {
          entryDate: input.entryDate ? this.parseEntryDate(input.entryDate) : undefined,
          description: input.description?.trim(),
          totalDebit: totals ? totals.debit : undefined,
          totalCredit: totals ? totals.credit : undefined,
          lines: normalized
            ? {
                create: normalized.map((line, index) => ({
                  lineNumber: index + 1,
                  accountId: line.accountId,
                  debit: line.debit,
                  credit: line.credit,
                  foreignCurrency: line.foreignCurrency,
                  foreignAmount: line.foreignAmount,
                  exchangeRate: line.exchangeRate,
                  costCenterId: line.costCenterId,
                  auxiliaryRuc: line.auxiliaryRuc,
                  auxiliaryDoc: line.auxiliaryDoc,
                  description: line.description,
                })),
              }
            : undefined,
        },
        include: detailInclude,
      });
    });

    return ContabilidadJournalPrismaMapper.toDetail(row);
  }

  async deleteDraft(applicationId: string, id: string): Promise<void> {
    const existing = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Journal entry not found');
    if (existing.status !== CONTABILIDAD_JOURNAL_STATUS.DRAFT) {
      throw new Error('Only draft entries can be deleted');
    }
    await this.prisma.contabilidadJournalEntry.delete({ where: { id } });
  }

  async post(
    applicationId: string,
    id: string,
    postedBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto> {
    const existing = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { applicationId, id },
      include: { lines: true, period: true },
    });
    if (!existing) throw new Error('Journal entry not found');
    if (existing.status !== CONTABILIDAD_JOURNAL_STATUS.DRAFT) {
      throw new Error('Only draft entries can be posted');
    }
    if (existing.period.status !== 'OPEN') {
      throw new Error('Period is closed');
    }
    if (existing.lines.length < 2) throw new Error('At least two lines are required');

    const totalDebit = roundPenAmount(Number(existing.totalDebit));
    const totalCredit = roundPenAmount(Number(existing.totalCredit));
    if (!amountsBalanced(totalDebit, totalCredit) || totalDebit <= 0) {
      throw new Error('Entry is not balanced');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contabilidadJournalEntry.update({
        where: { id },
        data: {
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
          postedBy: postedBy ?? null,
          postedAt: new Date(),
        },
        include: detailInclude,
      });

      const accountIds = existing.lines.map((line) => line.accountId);
      await tx.contabilidadAccount.updateMany({
        where: { applicationId, id: { in: accountIds } },
        data: { hasMovements: true },
      });

      return updated;
    });

    return ContabilidadJournalPrismaMapper.toDetail(row);
  }

  async reverse(
    applicationId: string,
    id: string,
    postedBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto> {
    const original = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { applicationId, id },
      include: { lines: { orderBy: { lineNumber: 'asc' } }, period: true },
    });
    if (!original) throw new Error('Journal entry not found');
    if (original.status !== CONTABILIDAD_JOURNAL_STATUS.POSTED) {
      throw new Error('Only posted entries can be reversed');
    }
    if (original.period.status !== 'OPEN') {
      throw new Error('Period is closed');
    }

    const entryNumber = await this.nextEntryNumber(original.legalEntityId, original.periodId);

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.contabilidadJournalEntry.update({
        where: { id },
        data: { status: CONTABILIDAD_JOURNAL_STATUS.REVERSED },
      });

      const reversal = await tx.contabilidadJournalEntry.create({
        data: {
          applicationId,
          legalEntityId: original.legalEntityId,
          periodId: original.periodId,
          entryNumber,
          entryDate: original.entryDate,
          description: `Reversa de asiento N° ${original.entryNumber} — ${original.description}`,
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
          totalDebit: original.totalCredit,
          totalCredit: original.totalDebit,
          reversalOfId: original.id,
          createdBy: postedBy ?? null,
          postedBy: postedBy ?? null,
          postedAt: new Date(),
          lines: {
            create: original.lines.map((line, index) => ({
              lineNumber: index + 1,
              accountId: line.accountId,
              debit: line.credit,
              credit: line.debit,
              foreignCurrency: line.foreignCurrency,
              foreignAmount: line.foreignAmount,
              exchangeRate: line.exchangeRate,
              costCenterId: line.costCenterId,
              auxiliaryRuc: line.auxiliaryRuc,
              auxiliaryDoc: line.auxiliaryDoc,
              description: line.description ? `Reversa: ${line.description}` : 'Reversa',
            })),
          },
        },
        include: detailInclude,
      });

      const accountIds = original.lines.map((line) => line.accountId);
      await tx.contabilidadAccount.updateMany({
        where: { applicationId, id: { in: accountIds } },
        data: { hasMovements: true },
      });

      return reversal;
    });

    return ContabilidadJournalPrismaMapper.toDetail(row);
  }

  async createAndPost(
    applicationId: string,
    input: CreateContabilidadJournalEntryInput,
    postedBy?: string | null,
  ): Promise<ContabilidadJournalEntryDetailDto> {
    const normalized = await this.normalizeLines(applicationId, input.lines, input.entryDate);
    if (normalized.length < 2) throw new Error('At least two lines are required');
    const totals = this.computeTotals(normalized);
    if (!amountsBalanced(totals.debit, totals.credit) || totals.debit <= 0) {
      throw new Error('Entry is not balanced');
    }

    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: input.periodId },
    });
    if (!period) throw new Error('Period not found');
    if (period.status !== 'OPEN') throw new Error('Period is closed');

    const entryNumber = await this.nextEntryNumber(period.legalEntityId, input.periodId);
    const entryDate = this.parseEntryDate(input.entryDate);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contabilidadJournalEntry.create({
        data: {
          applicationId,
          legalEntityId: period.legalEntityId,
          periodId: input.periodId,
          entryNumber,
          entryDate,
          description: input.description.trim(),
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
          totalDebit: totals.debit,
          totalCredit: totals.credit,
          createdBy: postedBy ?? null,
          postedBy: postedBy ?? null,
          postedAt: new Date(),
          lines: {
            create: normalized.map((line, index) => ({
              lineNumber: index + 1,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              foreignCurrency: line.foreignCurrency,
              foreignAmount: line.foreignAmount,
              exchangeRate: line.exchangeRate,
              costCenterId: line.costCenterId,
              auxiliaryRuc: line.auxiliaryRuc,
              auxiliaryDoc: line.auxiliaryDoc,
              description: line.description,
            })),
          },
        },
        include: {
          lines: { orderBy: { lineNumber: 'asc' }, include: lineInclude },
          _count: { select: { lines: true } },
        },
      });

      const accountIds = normalized.map((line) => line.accountId);
      await tx.contabilidadAccount.updateMany({
        where: { applicationId, id: { in: accountIds } },
        data: { hasMovements: true },
      });

      return created;
    });

    return ContabilidadJournalPrismaMapper.toDetail(row);
  }

  private async resolvePeriodLegalEntityId(applicationId: string, periodId: string): Promise<string> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
      select: { legalEntityId: true },
    });
    if (!period) throw new Error('Period not found');
    return period.legalEntityId;
  }

  private async nextEntryNumber(legalEntityId: string, periodId: string): Promise<number> {
    const last = await this.prisma.contabilidadJournalEntry.findFirst({
      where: { legalEntityId, periodId },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
    return (last?.entryNumber ?? 0) + 1;
  }

  private parseEntryDate(value: string): Date {
    const date = new Date(`${value}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid entry date');
    return date;
  }

  private computeTotals(lines: NormalizedLine[]) {
    const debit = roundPenAmount(lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundPenAmount(lines.reduce((sum, line) => sum + line.credit, 0));
    return { debit, credit };
  }

  private async lookupExchangeRate(
    applicationId: string,
    currencyCode: string,
    rateDate: string,
  ): Promise<number> {
    const row = await this.prisma.contabilidadExchangeRate.findUnique({
      where: {
        applicationId_rateDate_currencyCode: {
          applicationId,
          rateDate: new Date(`${rateDate}T12:00:00.000Z`),
          currencyCode,
        },
      },
    });
    if (!row) {
      throw new Error(`No hay tipo de cambio registrado para ${currencyCode} en ${rateDate}`);
    }
    return parseExchangeRate(Number(row.sellRate));
  }

  private async normalizeLines(
    applicationId: string,
    lines: ContabilidadJournalLineInput[],
    entryDate: string,
  ): Promise<NormalizedLine[]> {
    if (!lines?.length) throw new Error('At least one line is required');

    const normalized: NormalizedLine[] = [];

    for (const line of lines) {
      let debit = parsePenAmount(line.debit);
      let credit = parsePenAmount(line.credit);
      if (Number.isNaN(debit) || Number.isNaN(credit)) {
        throw new Error('Invalid amount');
      }
      if (debit > 0 && credit > 0) throw new Error('Line cannot have both debit and credit');

      const foreignCurrencyInput = line.foreignCurrency?.trim()
        ? normalizeCurrencyCode(line.foreignCurrency)
        : null;
      const foreignAmountRaw =
        line.foreignAmount != null && line.foreignAmount !== ''
          ? parsePenAmount(line.foreignAmount)
          : 0;

      let storedForeignCurrency: string | null = null;
      let storedForeignAmount: number | null = null;
      let storedExchangeRate: number | null = null;

      if (
        foreignCurrencyInput &&
        foreignCurrencyInput !== FUNCTIONAL_CURRENCY &&
        foreignAmountRaw > 0
      ) {
        let rate = parseExchangeRate(line.exchangeRate);
        if (!Number.isFinite(rate)) {
          rate = await this.lookupExchangeRate(applicationId, foreignCurrencyInput, entryDate);
        }
        const penFromForeign = convertForeignToPen(foreignAmountRaw, rate);
        if (debit > 0) {
          debit = penFromForeign;
        } else if (credit > 0) {
          credit = penFromForeign;
        } else {
          throw new Error('Indique debe o haber para la línea en moneda extranjera');
        }
        storedForeignCurrency = foreignCurrencyInput;
        storedForeignAmount = foreignAmountRaw;
        storedExchangeRate = rate;
      } else if (
        foreignCurrencyInput &&
        foreignCurrencyInput !== FUNCTIONAL_CURRENCY &&
        (line.foreignAmount != null && line.foreignAmount !== '')
      ) {
        throw new Error('Importe en moneda extranjera no válido');
      }

      const account = await this.prisma.contabilidadAccount.findFirst({
        where: { applicationId, id: line.accountId },
      });
      if (!account || !account.isActive) throw new Error('Account not found');
      if (!account.isMovement) throw new Error('Account must be a movement account');

      if (line.costCenterId) {
        const cc = await this.prisma.contabilidadCostCenter.findFirst({
          where: { applicationId, id: line.costCenterId, isActive: true },
        });
        if (!cc) throw new Error('Cost center not found');
      }

      normalized.push({
        accountId: line.accountId,
        debit,
        credit,
        foreignCurrency: storedForeignCurrency,
        foreignAmount: storedForeignAmount,
        exchangeRate: storedExchangeRate,
        costCenterId: line.costCenterId ?? null,
        auxiliaryRuc: line.auxiliaryRuc?.trim() || null,
        auxiliaryDoc: line.auxiliaryDoc?.trim() || null,
        description: line.description?.trim() || null,
      });
    }

    return normalized;
  }
}
