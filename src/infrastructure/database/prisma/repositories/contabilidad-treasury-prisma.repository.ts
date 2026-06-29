import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { CONTABILIDAD_JOURNAL_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_RECONCILIATION_STATUS,
  CONTABILIDAD_TREASURY_DEFAULTS,
  CONTABILIDAD_TREASURY_MOVEMENT_TYPE,
  CONTABILIDAD_TREASURY_SOURCE_TYPE,
} from '@domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  ContabilidadBankAccountDto,
  ContabilidadBankReconciliationDto,
  ContabilidadCashBoxDto,
  ContabilidadTreasuryMovementDto,
  ContabilidadTreasuryRepository,
  CreateBankAccountInput,
  CreateCashBoxInput,
  CreateTreasuryMovementInput,
  CreateTreasuryTransferInput,
  ListTreasuryMovementsFilters,
  UpdateBankAccountInput,
  UpdateCashBoxInput,
  UpsertReconciliationInput,
} from '@domain/repositories/contabilidad-treasury.repository';
import { parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { PrismaService } from '../prisma.service';
import { ContabilidadTreasuryPrismaMapper } from '../mappers/contabilidad-treasury-prisma.mapper';

const movementInclude = {
  cashBox: { select: { code: true, name: true } },
  bankAccount: { select: { code: true, bankName: true } },
  offsetAccount: { select: { code: true, name: true } },
} as const;

const cashInclude = { account: { select: { code: true, name: true } } } as const;
const bankInclude = { account: { select: { code: true, name: true } } } as const;

@Injectable()
export class ContabilidadTreasuryPrismaRepository implements ContabilidadTreasuryRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTABILIDAD_JOURNAL_REPOSITORY)
    private readonly journal: ContabilidadJournalRepository,
  ) {}

  async ensureDefaults(applicationId: string): Promise<void> {
    const cashCount = await this.prisma.contabilidadCashBox.count({ where: { applicationId } });
    if (cashCount === 0) {
      const cashAccount = await this.prisma.contabilidadAccount.findUnique({
        where: {
          applicationId_code: {
            applicationId,
            code: CONTABILIDAD_TREASURY_DEFAULTS.CASH_ACCOUNT_CODE,
          },
        },
      });
      if (cashAccount) {
        await this.prisma.contabilidadCashBox.create({
          data: {
            applicationId,
            accountId: cashAccount.id,
            code: CONTABILIDAD_TREASURY_DEFAULTS.CASH_CODE,
            name: CONTABILIDAD_TREASURY_DEFAULTS.CASH_NAME,
          },
        });
      }
    }

    const bankCount = await this.prisma.contabilidadBankAccount.count({ where: { applicationId } });
    if (bankCount === 0) {
      const bankAccount = await this.prisma.contabilidadAccount.findUnique({
        where: {
          applicationId_code: {
            applicationId,
            code: CONTABILIDAD_TREASURY_DEFAULTS.BANK_ACCOUNT_CODE,
          },
        },
      });
      if (bankAccount) {
        await this.prisma.contabilidadBankAccount.create({
          data: {
            applicationId,
            accountId: bankAccount.id,
            code: CONTABILIDAD_TREASURY_DEFAULTS.BANK_CODE,
            bankName: CONTABILIDAD_TREASURY_DEFAULTS.BANK_NAME,
            accountNumber: CONTABILIDAD_TREASURY_DEFAULTS.BANK_ACCOUNT_NUMBER,
            cci: null,
            currency: 'PEN',
          },
        });
      }
    }
  }

  async listCashBoxes(applicationId: string): Promise<ContabilidadCashBoxDto[]> {
    const rows = await this.prisma.contabilidadCashBox.findMany({
      where: { applicationId },
      include: cashInclude,
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });
    return Promise.all(
      rows.map(async (row) =>
        ContabilidadTreasuryPrismaMapper.toCashBox(row, await this.computeCashBalance(applicationId, row.id)),
      ),
    );
  }

  async findCashBoxById(applicationId: string, id: string): Promise<ContabilidadCashBoxDto | null> {
    const row = await this.prisma.contabilidadCashBox.findFirst({
      where: { applicationId, id },
      include: cashInclude,
    });
    if (!row) return null;
    return ContabilidadTreasuryPrismaMapper.toCashBox(
      row,
      await this.computeCashBalance(applicationId, row.id),
    );
  }

  async createCashBox(applicationId: string, input: CreateCashBoxInput): Promise<ContabilidadCashBoxDto> {
    const row = await this.prisma.contabilidadCashBox.create({
      data: {
        applicationId,
        accountId: input.accountId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
      },
      include: cashInclude,
    });
    return ContabilidadTreasuryPrismaMapper.toCashBox(row, 0);
  }

  async updateCashBox(
    applicationId: string,
    id: string,
    input: UpdateCashBoxInput,
  ): Promise<ContabilidadCashBoxDto> {
    const row = await this.prisma.contabilidadCashBox.update({
      where: { id },
      data: {
        code: input.code?.trim().toUpperCase(),
        name: input.name?.trim(),
        accountId: input.accountId,
        isActive: input.isActive,
      },
      include: cashInclude,
    });
    if (row.applicationId !== applicationId) throw new Error('Cash box not found');
    return ContabilidadTreasuryPrismaMapper.toCashBox(
      row,
      await this.computeCashBalance(applicationId, row.id),
    );
  }

  async listBankAccounts(applicationId: string): Promise<ContabilidadBankAccountDto[]> {
    const rows = await this.prisma.contabilidadBankAccount.findMany({
      where: { applicationId },
      include: bankInclude,
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });
    return Promise.all(
      rows.map(async (row) =>
        ContabilidadTreasuryPrismaMapper.toBankAccount(
          row,
          await this.computeBankBalance(applicationId, row.id),
        ),
      ),
    );
  }

  async findBankAccountById(applicationId: string, id: string): Promise<ContabilidadBankAccountDto | null> {
    const row = await this.prisma.contabilidadBankAccount.findFirst({
      where: { applicationId, id },
      include: bankInclude,
    });
    if (!row) return null;
    return ContabilidadTreasuryPrismaMapper.toBankAccount(
      row,
      await this.computeBankBalance(applicationId, row.id),
    );
  }

  async createBankAccount(
    applicationId: string,
    input: CreateBankAccountInput,
  ): Promise<ContabilidadBankAccountDto> {
    const row = await this.prisma.contabilidadBankAccount.create({
      data: {
        applicationId,
        accountId: input.accountId,
        code: input.code.trim().toUpperCase(),
        bankName: input.bankName.trim(),
        accountNumber: input.accountNumber.trim(),
        cci: input.cci?.trim() || null,
        currency: input.currency?.trim().toUpperCase() || 'PEN',
      },
      include: bankInclude,
    });
    return ContabilidadTreasuryPrismaMapper.toBankAccount(row, 0);
  }

  async updateBankAccount(
    applicationId: string,
    id: string,
    input: UpdateBankAccountInput,
  ): Promise<ContabilidadBankAccountDto> {
    const row = await this.prisma.contabilidadBankAccount.update({
      where: { id },
      data: {
        code: input.code?.trim().toUpperCase(),
        bankName: input.bankName?.trim(),
        accountNumber: input.accountNumber?.trim(),
        cci: input.cci === undefined ? undefined : input.cci?.trim() || null,
        currency: input.currency?.trim().toUpperCase(),
        accountId: input.accountId,
        isActive: input.isActive,
      },
      include: bankInclude,
    });
    if (row.applicationId !== applicationId) throw new Error('Bank account not found');
    return ContabilidadTreasuryPrismaMapper.toBankAccount(
      row,
      await this.computeBankBalance(applicationId, row.id),
    );
  }

  async listMovements(
    applicationId: string,
    filters: ListTreasuryMovementsFilters,
  ): Promise<ContabilidadTreasuryMovementDto[]> {
    const where: Prisma.ContabilidadTreasuryMovementWhereInput = { applicationId };
    if (filters.periodId) where.periodId = filters.periodId;
    if (filters.cashBoxId) where.cashBoxId = filters.cashBoxId;
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId;
    if (filters.movementType) where.movementType = filters.movementType;
    if (filters.sourceType) where.sourceType = filters.sourceType;
    if (filters.unreconciledOnly) {
      where.sourceType = CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK;
      where.reconciledAt = null;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.movementDate = {};
      if (filters.dateFrom) where.movementDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.movementDate.lte = new Date(filters.dateTo);
    }
    const q = filters.search?.trim();
    if (q) where.description = { contains: q, mode: 'insensitive' };

    const rows = await this.prisma.contabilidadTreasuryMovement.findMany({
      where,
      include: movementInclude,
      orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ContabilidadTreasuryPrismaMapper.toMovement(row));
  }

  async findMovementById(
    applicationId: string,
    id: string,
  ): Promise<ContabilidadTreasuryMovementDto | null> {
    const row = await this.prisma.contabilidadTreasuryMovement.findFirst({
      where: { applicationId, id },
      include: movementInclude,
    });
    return row ? ContabilidadTreasuryPrismaMapper.toMovement(row) : null;
  }

  async createMovementWithJournal(
    applicationId: string,
    input: CreateTreasuryMovementInput,
    createdBy?: string | null,
  ): Promise<ContabilidadTreasuryMovementDto> {
    const amount = parsePenAmount(input.amount);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    const ledgerAccountId = await this.resolveLedgerAccountId(applicationId, input);
    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.movementDate,
        description: input.description.trim(),
        lines:
          input.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN
            ? [
                { accountId: ledgerAccountId, debit: amount },
                { accountId: input.offsetAccountId, credit: amount },
              ]
            : [
                { accountId: input.offsetAccountId, debit: amount },
                { accountId: ledgerAccountId, credit: amount },
              ],
      },
      createdBy,
    );

    const row = await this.prisma.contabilidadTreasuryMovement.create({
      data: {
        applicationId,
        periodId: input.periodId,
        movementType: input.movementType,
        sourceType: input.sourceType,
        cashBoxId: input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH ? input.cashBoxId : null,
        bankAccountId:
          input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK ? input.bankAccountId : null,
        offsetAccountId: input.offsetAccountId,
        amount,
        movementDate: new Date(`${input.movementDate}T12:00:00.000Z`),
        description: input.description.trim(),
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: movementInclude,
    });

    return ContabilidadTreasuryPrismaMapper.toMovement(row);
  }

  async createTransferWithJournal(
    applicationId: string,
    input: CreateTreasuryTransferInput,
    createdBy?: string | null,
  ): Promise<ContabilidadTreasuryMovementDto[]> {
    const amount = parsePenAmount(input.amount);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    const fromAccountId = await this.resolveTransferAccountId(applicationId, {
      type: input.fromType,
      cashBoxId: input.fromCashBoxId,
      bankAccountId: input.fromBankAccountId,
    });
    const toAccountId = await this.resolveTransferAccountId(applicationId, {
      type: input.toType,
      cashBoxId: input.toCashBoxId,
      bankAccountId: input.toBankAccountId,
    });
    if (fromAccountId === toAccountId) throw new Error('Source and target must differ');

    const journal = await this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.movementDate,
        description: input.description.trim(),
        lines: [
          { accountId: toAccountId, debit: amount },
          { accountId: fromAccountId, credit: amount },
        ],
      },
      createdBy,
    );

    const transferGroupId = randomUUID();
    const movementDate = new Date(`${input.movementDate}T12:00:00.000Z`);

    const outRow = await this.prisma.contabilidadTreasuryMovement.create({
      data: {
        applicationId,
        periodId: input.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_OUT,
        sourceType: input.fromType,
        cashBoxId: input.fromType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH ? input.fromCashBoxId : null,
        bankAccountId:
          input.fromType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK ? input.fromBankAccountId : null,
        transferGroupId,
        amount,
        movementDate,
        description: input.description.trim(),
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: movementInclude,
    });

    const inRow = await this.prisma.contabilidadTreasuryMovement.create({
      data: {
        applicationId,
        periodId: input.periodId,
        movementType: CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_IN,
        sourceType: input.toType,
        cashBoxId: input.toType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH ? input.toCashBoxId : null,
        bankAccountId: input.toType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK ? input.toBankAccountId : null,
        transferGroupId,
        amount,
        movementDate,
        description: input.description.trim(),
        journalEntryId: journal.id,
        createdBy: createdBy ?? null,
      },
      include: movementInclude,
    });

    return [
      ContabilidadTreasuryPrismaMapper.toMovement(outRow),
      ContabilidadTreasuryPrismaMapper.toMovement(inRow),
    ];
  }

  async getReconciliation(
    applicationId: string,
    bankAccountId: string,
    periodId: string,
  ): Promise<ContabilidadBankReconciliationDto | null> {
    const row = await this.prisma.contabilidadBankReconciliation.findUnique({
      where: {
        applicationId_bankAccountId_periodId: { applicationId, bankAccountId, periodId },
      },
      include: { bankAccount: { select: { code: true, bankName: true } } },
    });
    if (!row) return null;
    return this.mapReconciliation(applicationId, row);
  }

  async upsertReconciliation(
    applicationId: string,
    input: UpsertReconciliationInput,
  ): Promise<ContabilidadBankReconciliationDto> {
    const statementBalance = parsePenAmount(input.statementBalance);
    if (Number.isNaN(statementBalance)) throw new Error('Invalid statement balance');

    const row = await this.prisma.contabilidadBankReconciliation.upsert({
      where: {
        applicationId_bankAccountId_periodId: {
          applicationId,
          bankAccountId: input.bankAccountId,
          periodId: input.periodId,
        },
      },
      create: {
        applicationId,
        bankAccountId: input.bankAccountId,
        periodId: input.periodId,
        statementBalance,
        notes: input.notes?.trim() || null,
      },
      update: {
        statementBalance,
        notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
      },
      include: { bankAccount: { select: { code: true, bankName: true } } },
    });

    return this.mapReconciliation(applicationId, row);
  }

  async toggleMovementReconciled(
    applicationId: string,
    reconciliationId: string,
    movementId: string,
    reconciled: boolean,
  ): Promise<ContabilidadBankReconciliationDto> {
    const reconciliation = await this.prisma.contabilidadBankReconciliation.findFirst({
      where: { applicationId, id: reconciliationId },
    });
    if (!reconciliation) throw new Error('Reconciliation not found');
    if (reconciliation.status === CONTABILIDAD_RECONCILIATION_STATUS.CLOSED) {
      throw new Error('Reconciliation is closed');
    }

    const movement = await this.prisma.contabilidadTreasuryMovement.findFirst({
      where: { applicationId, id: movementId, bankAccountId: reconciliation.bankAccountId },
    });
    if (!movement) throw new Error('Movement not found');

    await this.prisma.contabilidadTreasuryMovement.update({
      where: { id: movementId },
      data: {
        reconciliationId: reconciled ? reconciliationId : null,
        reconciledAt: reconciled ? new Date() : null,
      },
    });

    const row = await this.prisma.contabilidadBankReconciliation.findFirst({
      where: { id: reconciliationId },
      include: { bankAccount: { select: { code: true, bankName: true } } },
    });
    if (!row) throw new Error('Reconciliation not found');
    return this.mapReconciliation(applicationId, row);
  }

  async closeReconciliation(applicationId: string, id: string): Promise<ContabilidadBankReconciliationDto> {
    const row = await this.prisma.contabilidadBankReconciliation.update({
      where: { id },
      data: {
        status: CONTABILIDAD_RECONCILIATION_STATUS.CLOSED,
        closedAt: new Date(),
      },
      include: { bankAccount: { select: { code: true, bankName: true } } },
    });
    if (row.applicationId !== applicationId) throw new Error('Reconciliation not found');
    return this.mapReconciliation(applicationId, row);
  }

  private async mapReconciliation(
    applicationId: string,
    row: {
      id: string;
      bankAccountId: string;
      periodId: string;
      statementBalance: Prisma.Decimal;
      notes: string | null;
      status: string;
      closedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      bankAccount: { code: string; bankName: string };
    },
  ): Promise<ContabilidadBankReconciliationDto> {
    const bookBalance = await this.computeBankBalance(applicationId, row.bankAccountId);
    const movements = await this.prisma.contabilidadTreasuryMovement.findMany({
      where: {
        applicationId,
        bankAccountId: row.bankAccountId,
        periodId: row.periodId,
      },
      select: { reconciledAt: true },
    });
    const reconciledCount = movements.filter((m) => m.reconciledAt).length;
    const pendingCount = movements.length - reconciledCount;
    return ContabilidadTreasuryPrismaMapper.toReconciliation(
      row,
      bookBalance,
      reconciledCount,
      pendingCount,
    );
  }

  private async computeCashBalance(applicationId: string, cashBoxId: string): Promise<number> {
    const movements = await this.prisma.contabilidadTreasuryMovement.findMany({
      where: { applicationId, cashBoxId },
      select: { movementType: true, amount: true },
    });
    return this.sumBalance(movements);
  }

  private async computeBankBalance(applicationId: string, bankAccountId: string): Promise<number> {
    const movements = await this.prisma.contabilidadTreasuryMovement.findMany({
      where: { applicationId, bankAccountId },
      select: { movementType: true, amount: true },
    });
    return this.sumBalance(movements);
  }

  private sumBalance(movements: { movementType: string; amount: Prisma.Decimal }[]): number {
    let balance = 0;
    for (const m of movements) {
      const amount = Number(m.amount);
      if (
        m.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN ||
        m.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.TRANSFER_IN
      ) {
        balance += amount;
      } else {
        balance -= amount;
      }
    }
    return roundPenAmount(balance);
  }

  private async resolveLedgerAccountId(
    applicationId: string,
    input: CreateTreasuryMovementInput,
  ): Promise<string> {
    if (input.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH) {
      if (!input.cashBoxId) throw new Error('Cash box required');
      const box = await this.prisma.contabilidadCashBox.findFirst({
        where: { applicationId, id: input.cashBoxId, isActive: true },
      });
      if (!box) throw new Error('Cash box not found');
      return box.accountId;
    }
    if (!input.bankAccountId) throw new Error('Bank account required');
    const bank = await this.prisma.contabilidadBankAccount.findFirst({
      where: { applicationId, id: input.bankAccountId, isActive: true },
    });
    if (!bank) throw new Error('Bank account not found');
    return bank.accountId;
  }

  private async resolveTransferAccountId(
    applicationId: string,
    input: { type: 'CASH' | 'BANK'; cashBoxId?: string | null; bankAccountId?: string | null },
  ): Promise<string> {
    if (input.type === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH) {
      if (!input.cashBoxId) throw new Error('Cash box required');
      const box = await this.prisma.contabilidadCashBox.findFirst({
        where: { applicationId, id: input.cashBoxId, isActive: true },
      });
      if (!box) throw new Error('Cash box not found');
      return box.accountId;
    }
    if (!input.bankAccountId) throw new Error('Bank account required');
    const bank = await this.prisma.contabilidadBankAccount.findFirst({
      where: { applicationId, id: input.bankAccountId, isActive: true },
    });
    if (!bank) throw new Error('Bank account not found');
    return bank.accountId;
  }
}
