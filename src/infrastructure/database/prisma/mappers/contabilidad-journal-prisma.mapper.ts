import { Prisma } from '@prisma/client';
import type {
  ContabilidadJournalEntryDetailDto,
  ContabilidadJournalEntryListItemDto,
  ContabilidadJournalLineDto,
} from '@domain/repositories/contabilidad-journal.repository';
import { formatPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { formatExchangeRate } from '@domain/utils/contabilidad-multicurrency.util';
import { toIsoDate } from '@domain/utils/peru-date.util';

type JournalLineRow = {
  id: string;
  lineNumber: number;
  accountId: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  foreignCurrency: string | null;
  foreignAmount: Prisma.Decimal | null;
  exchangeRate: Prisma.Decimal | null;
  costCenterId: string | null;
  auxiliaryRuc: string | null;
  auxiliaryDoc: string | null;
  description: string | null;
  account: { code: string; name: string };
  costCenter: { code: string; name: string } | null;
};

type JournalEntryRow = {
  id: string;
  periodId: string;
  entryNumber: number;
  entryDate: Date;
  description: string;
  status: string;
  totalDebit: Prisma.Decimal;
  totalCredit: Prisma.Decimal;
  postedAt: Date | null;
  reversalOfId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: JournalLineRow[];
  _count?: { lines: number };
};

function toLineDto(row: JournalLineRow): ContabilidadJournalLineDto {
  return {
    id: row.id,
    lineNumber: row.lineNumber,
    accountId: row.accountId,
    accountCode: row.account.code,
    accountName: row.account.name,
    debit: formatPenAmount(Number(row.debit)),
    credit: formatPenAmount(Number(row.credit)),
    foreignCurrency: row.foreignCurrency,
    foreignAmount: row.foreignAmount != null ? formatPenAmount(Number(row.foreignAmount)) : null,
    exchangeRate: row.exchangeRate != null ? formatExchangeRate(Number(row.exchangeRate)) : null,
    costCenterId: row.costCenterId,
    costCenterCode: row.costCenter?.code ?? null,
    costCenterName: row.costCenter?.name ?? null,
    auxiliaryRuc: row.auxiliaryRuc,
    auxiliaryDoc: row.auxiliaryDoc,
    description: row.description,
  };
}

export const ContabilidadJournalPrismaMapper = {
  toListItem(row: JournalEntryRow): ContabilidadJournalEntryListItemDto {
    return {
      id: row.id,
      periodId: row.periodId,
      entryNumber: row.entryNumber,
      entryDate: toIsoDate(row.entryDate),
      description: row.description,
      status: row.status,
      totalDebit: formatPenAmount(Number(row.totalDebit)),
      totalCredit: formatPenAmount(Number(row.totalCredit)),
      lineCount: row._count?.lines ?? row.lines?.length ?? 0,
      postedAt: row.postedAt?.toISOString() ?? null,
      reversalOfId: row.reversalOfId,
    };
  },

  toDetail(row: JournalEntryRow): ContabilidadJournalEntryDetailDto {
    return {
      ...ContabilidadJournalPrismaMapper.toListItem(row),
      lines: (row.lines ?? []).map(toLineDto),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },
};
