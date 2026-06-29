import type {
  ContabilidadBankAccountDto,
  ContabilidadBankReconciliationDto,
  ContabilidadCashBoxDto,
  ContabilidadTreasuryMovementDto,
} from '@domain/repositories/contabilidad-treasury.repository';
import { formatPenAmount } from '@domain/utils/contabilidad-journal-amounts';

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export const ContabilidadTreasuryPrismaMapper = {
  toCashBox(
    row: {
      id: string;
      accountId: string;
      code: string;
      name: string;
      isActive: boolean;
      account: { code: string; name: string };
    },
    balance: number,
  ): ContabilidadCashBoxDto {
    return {
      id: row.id,
      accountId: row.accountId,
      accountCode: row.account.code,
      accountName: row.account.name,
      code: row.code,
      name: row.name,
      isActive: row.isActive,
      balance: formatPenAmount(balance),
    };
  },

  toBankAccount(
    row: {
      id: string;
      accountId: string;
      code: string;
      bankName: string;
      accountNumber: string;
      cci: string | null;
      currency: string;
      isActive: boolean;
      account: { code: string; name: string };
    },
    balance: number,
  ): ContabilidadBankAccountDto {
    return {
      id: row.id,
      accountId: row.accountId,
      accountCode: row.account.code,
      accountName: row.account.name,
      code: row.code,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      cci: row.cci,
      currency: row.currency,
      isActive: row.isActive,
      balance: formatPenAmount(balance),
    };
  },

  toMovement(row: {
    id: string;
    periodId: string;
    movementType: string;
    sourceType: string;
    cashBoxId: string | null;
    bankAccountId: string | null;
    offsetAccountId: string | null;
    transferGroupId: string | null;
    amount: { toString(): string } | number;
    movementDate: Date;
    description: string;
    journalEntryId: string | null;
    reconciliationId: string | null;
    reconciledAt: Date | null;
    createdAt: Date;
    cashBox?: { code: string; name: string } | null;
    bankAccount?: { code: string; bankName: string } | null;
    offsetAccount?: { code: string; name: string } | null;
  }): ContabilidadTreasuryMovementDto {
    return {
      id: row.id,
      periodId: row.periodId,
      movementType: row.movementType,
      sourceType: row.sourceType,
      cashBoxId: row.cashBoxId,
      cashBoxCode: row.cashBox?.code ?? null,
      cashBoxName: row.cashBox?.name ?? null,
      bankAccountId: row.bankAccountId,
      bankCode: row.bankAccount?.code ?? null,
      bankName: row.bankAccount?.bankName ?? null,
      offsetAccountId: row.offsetAccountId,
      offsetAccountCode: row.offsetAccount?.code ?? null,
      offsetAccountName: row.offsetAccount?.name ?? null,
      transferGroupId: row.transferGroupId,
      amount: formatPenAmount(Number(row.amount)),
      movementDate: toIsoDate(row.movementDate),
      description: row.description,
      journalEntryId: row.journalEntryId,
      reconciliationId: row.reconciliationId,
      reconciledAt: row.reconciledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  },

  toReconciliation(
    row: {
      id: string;
      bankAccountId: string;
      periodId: string;
      statementBalance: { toString(): string } | number;
      notes: string | null;
      status: string;
      closedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      bankAccount: { code: string; bankName: string };
    },
    bookBalance: number,
    reconciledCount: number,
    pendingCount: number,
  ): ContabilidadBankReconciliationDto {
    const book = formatPenAmount(bookBalance);
    const statement = formatPenAmount(Number(row.statementBalance));
    const diff = formatPenAmount(bookBalance - Number(row.statementBalance));
    return {
      id: row.id,
      bankAccountId: row.bankAccountId,
      bankCode: row.bankAccount.code,
      bankName: row.bankAccount.bankName,
      periodId: row.periodId,
      statementBalance: statement,
      bookBalance: book,
      difference: diff,
      reconciledCount,
      pendingCount,
      notes: row.notes,
      status: row.status,
      closedAt: row.closedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },
};
