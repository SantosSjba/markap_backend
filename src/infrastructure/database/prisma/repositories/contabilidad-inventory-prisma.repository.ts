import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_JOURNAL_REPOSITORY } from '@common/constants/injection-tokens';
import { CONTABILIDAD_PAYABLE_ACCOUNT_CODE } from '@domain/constants/contabilidad-taxes.defaults';
import {
  CONTABILIDAD_INVENTORY_COGS_ACCOUNT_CODE,
  CONTABILIDAD_INVENTORY_COST_METHOD,
  CONTABILIDAD_INVENTORY_EXPENSE_ACCOUNT_CODE,
  CONTABILIDAD_INVENTORY_MOVEMENT_TYPE,
  CONTABILIDAD_INVENTORY_OFFSET_TYPE,
} from '@domain/constants/contabilidad-inventory.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';
import type {
  ContabilidadInventoryItemDto,
  ContabilidadInventoryKardexLineDto,
  ContabilidadInventoryMovementDto,
  ContabilidadInventoryRepository,
  ContabilidadInventoryValuedLineDto,
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  ListInventoryItemsFilters,
  ListInventoryMovementsFilters,
  UpdateInventoryItemInput,
} from '@domain/repositories/contabilidad-inventory.repository';
import { parsePenAmount, roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const itemInclude = {
  account: { select: { id: true, code: true, name: true } },
} as const;

const movementInclude = {
  item: { select: { id: true, code: true, description: true } },
} as const;

function roundQty(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function formatQty(value: number | string | { toString(): string }): string {
  return roundQty(Number(value.toString())).toFixed(4);
}

function formatMoney(value: number): string {
  return roundPenAmount(value).toFixed(2);
}

function mapItem(row: {
  id: string;
  code: string;
  description: string;
  accountId: string;
  unit: string;
  costMethod: string;
  quantityOnHand: { toString(): string };
  avgUnitCost: { toString(): string };
  isActive: boolean;
  account: { code: string; name: string };
}): ContabilidadInventoryItemDto {
  const qty = Number(row.quantityOnHand);
  const avg = Number(row.avgUnitCost);
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    accountId: row.accountId,
    accountCode: row.account.code,
    accountName: row.account.name,
    unit: row.unit,
    costMethod: row.costMethod,
    quantityOnHand: formatQty(qty),
    avgUnitCost: formatQty(avg),
    valuedBalance: formatMoney(qty * avg),
    isActive: row.isActive,
  };
}

@Injectable()
export class ContabilidadInventoryPrismaRepository implements ContabilidadInventoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTABILIDAD_JOURNAL_REPOSITORY)
    private readonly journal: ContabilidadJournalRepository,
  ) {}

  async listItems(applicationId: string, filters: ListInventoryItemsFilters) {
    const rows = await this.prisma.contabilidadInventoryItem.findMany({
      where: {
        applicationId,
        ...(filters.activeOnly !== false ? { isActive: true } : {}),
        ...(filters.accountId ? { accountId: filters.accountId } : {}),
        ...(filters.search?.trim()
          ? {
              OR: [
                { code: { contains: filters.search.trim(), mode: 'insensitive' } },
                { description: { contains: filters.search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: itemInclude,
      orderBy: [{ code: 'asc' }],
    });
    return { items: rows.map(mapItem) };
  }

  async getItem(applicationId: string, id: string) {
    const row = await this.prisma.contabilidadInventoryItem.findFirst({
      where: { applicationId, id },
      include: itemInclude,
    });
    return row ? mapItem(row) : null;
  }

  async createItem(applicationId: string, input: CreateInventoryItemInput) {
    const account = await this.prisma.contabilidadAccount.findFirst({
      where: { applicationId, id: input.accountId, isMovement: true, isActive: true },
    });
    if (!account) throw new Error('Cuenta de inventario inválida');
    if (!account.code.startsWith('20') && !account.code.startsWith('21')) {
      throw new Error('La cuenta debe pertenecer al grupo 20 o 21');
    }

    const row = await this.prisma.contabilidadInventoryItem.create({
      data: {
        applicationId,
        code: input.code.trim().toUpperCase(),
        description: input.description.trim(),
        accountId: input.accountId,
        unit: input.unit?.trim() || 'UN',
        costMethod: input.costMethod ?? CONTABILIDAD_INVENTORY_COST_METHOD.PROMEDIO,
      },
      include: itemInclude,
    });
    return mapItem(row);
  }

  async updateItem(applicationId: string, id: string, input: UpdateInventoryItemInput) {
    const existing = await this.prisma.contabilidadInventoryItem.findFirst({
      where: { applicationId, id },
    });
    if (!existing) throw new Error('Ítem no encontrado');
    if (input.accountId && input.accountId !== existing.accountId) {
      const movements = await this.prisma.contabilidadInventoryMovement.count({ where: { itemId: id } });
      if (movements > 0) throw new Error('No se puede cambiar la cuenta con movimientos registrados');
    }

    const row = await this.prisma.contabilidadInventoryItem.update({
      where: { id },
      data: {
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
        ...(input.unit !== undefined ? { unit: input.unit.trim() } : {}),
        ...(input.costMethod !== undefined ? { costMethod: input.costMethod } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: itemInclude,
    });
    return mapItem(row);
  }

  async listMovements(applicationId: string, filters: ListInventoryMovementsFilters) {
    const rows = await this.prisma.contabilidadInventoryMovement.findMany({
      where: {
        applicationId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.itemId ? { itemId: filters.itemId } : {}),
        ...(filters.movementType ? { movementType: filters.movementType } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              movementDate: {
                ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T12:00:00.000Z`) } : {}),
                ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T12:00:00.000Z`) } : {}),
              },
            }
          : {}),
      },
      include: movementInclude,
      orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
    });

    const movements: ContabilidadInventoryMovementDto[] = [];
    for (const row of rows) {
      const kardex = await this.buildKardexLines(applicationId, row.itemId);
      const line = kardex.find((l) => l.id === row.id);
      movements.push({
        id: row.id,
        itemId: row.itemId,
        itemCode: row.item.code,
        itemDescription: row.item.description,
        periodId: row.periodId,
        movementType: row.movementType,
        movementDate: row.movementDate.toISOString().slice(0, 10),
        quantity: formatQty(row.quantity),
        unitCost: formatQty(row.unitCost),
        totalAmount: formatMoney(Number(row.totalAmount)),
        offsetType: row.offsetType,
        notes: row.notes,
        journalEntryId: row.journalEntryId,
        runningQuantity: line?.runningQuantity ?? formatQty(0),
        runningValue: line?.runningValue ?? formatMoney(0),
        createdAt: row.createdAt.toISOString(),
      });
    }
    return { movements };
  }

  async createMovement(
    applicationId: string,
    input: CreateInventoryMovementInput,
    createdBy?: string | null,
  ): Promise<ContabilidadInventoryMovementDto> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: input.periodId },
    });
    if (!period) throw new Error('Periodo no encontrado');
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new Error('El periodo contable está cerrado');
    }

    const item = await this.prisma.contabilidadInventoryItem.findFirst({
      where: { applicationId, id: input.itemId, isActive: true },
      include: itemInclude,
    });
    if (!item) throw new Error('Ítem de inventario no encontrado');

    const movementType = input.movementType.trim().toUpperCase();
    if (!Object.values(CONTABILIDAD_INVENTORY_MOVEMENT_TYPE).includes(movementType as never)) {
      throw new Error('Tipo de movimiento inválido');
    }

    let signedQty = Number(input.quantity);
    if (!Number.isFinite(signedQty) || signedQty === 0) throw new Error('Cantidad inválida');

    if (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN && signedQty < 0) {
      throw new Error('La cantidad de entrada debe ser positiva');
    }
    if (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.OUT && signedQty < 0) {
      throw new Error('La cantidad de salida debe ser positiva');
    }
    if (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.OUT) {
      signedQty = Math.abs(signedQty);
    }
    if (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN) {
      signedQty = Math.abs(signedQty);
    }

    const isInbound =
      movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN ||
      (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST && signedQty > 0);
    const isOutbound =
      movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.OUT ||
      (movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST && signedQty < 0);

    const absQty = Math.abs(signedQty);
    let unitCost = input.unitCost !== undefined ? parsePenAmount(String(input.unitCost)) : 0;

    if (isInbound) {
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        throw new Error('Costo unitario obligatorio en entradas');
      }
    } else if (isOutbound) {
      if (item.costMethod === CONTABILIDAD_INVENTORY_COST_METHOD.PEPS) {
        unitCost = await this.resolvePepsOutUnitCost(applicationId, item.id, absQty);
      } else {
        unitCost = Number(item.avgUnitCost);
      }
      if (Number(item.quantityOnHand) + 0.0001 < absQty) {
        throw new Error('Stock insuficiente para la salida');
      }
    }

    const totalAmount = roundPenAmount(absQty * unitCost);
    const journal = await this.postMovementJournal(
      applicationId,
      item,
      input,
      movementType,
      absQty,
      unitCost,
      totalAmount,
      isInbound,
      createdBy,
    );

    const storedQty =
      movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST ? signedQty : absQty;

    const movement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contabilidadInventoryMovement.create({
        data: {
          applicationId,
          itemId: item.id,
          periodId: input.periodId,
          movementType,
          movementDate: new Date(`${input.movementDate}T12:00:00.000Z`),
          quantity: storedQty,
          unitCost,
          totalAmount,
          offsetType: isInbound ? (input.offsetType ?? CONTABILIDAD_INVENTORY_OFFSET_TYPE.PAYABLE) : null,
          remainingQty:
            isInbound && item.costMethod === CONTABILIDAD_INVENTORY_COST_METHOD.PEPS ? absQty : null,
          notes: input.notes?.trim() || null,
          journalEntryId: journal.id,
          createdBy: createdBy ?? null,
        },
        include: movementInclude,
      });

      const currentQty = Number(item.quantityOnHand);
      const currentAvg = Number(item.avgUnitCost);
      let newQty = currentQty;
      let newAvg = currentAvg;

      if (isInbound) {
        newQty = roundQty(currentQty + absQty);
        if (item.costMethod === CONTABILIDAD_INVENTORY_COST_METHOD.PROMEDIO) {
          newAvg = newQty > 0 ? roundQty((currentQty * currentAvg + absQty * unitCost) / newQty) : 0;
        } else {
          newAvg = newQty > 0 ? roundQty((currentQty * currentAvg + absQty * unitCost) / newQty) : 0;
        }
      } else {
        newQty = roundQty(currentQty - absQty);
        if (item.costMethod === CONTABILIDAD_INVENTORY_COST_METHOD.PEPS) {
          await this.consumePepsBatchesTx(tx, item.id, absQty);
        }
        if (newQty <= 0.00005) {
          newQty = 0;
          newAvg = 0;
        }
      }

      await tx.contabilidadInventoryItem.update({
        where: { id: item.id },
        data: { quantityOnHand: newQty, avgUnitCost: newAvg },
      });

      return created;
    });

    const kardex = await this.buildKardexLines(applicationId, item.id);
    const line = kardex.find((l) => l.id === movement.id)!;

    return {
      id: movement.id,
      itemId: movement.itemId,
      itemCode: movement.item.code,
      itemDescription: movement.item.description,
      periodId: movement.periodId,
      movementType: movement.movementType,
      movementDate: movement.movementDate.toISOString().slice(0, 10),
      quantity: formatQty(movement.quantity),
      unitCost: formatQty(movement.unitCost),
      totalAmount: formatMoney(Number(movement.totalAmount)),
      offsetType: movement.offsetType,
      notes: movement.notes,
      journalEntryId: movement.journalEntryId,
      runningQuantity: line.runningQuantity,
      runningValue: line.runningValue,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  async getKardex(applicationId: string, itemId: string) {
    const item = await this.getItem(applicationId, itemId);
    if (!item) throw new Error('Ítem no encontrado');
    const lines = await this.buildKardexLines(applicationId, itemId);
    return { item, lines };
  }

  async getValuedBalance(applicationId: string) {
    const { items } = await this.listItems(applicationId, { activeOnly: false });
    const lines: ContabilidadInventoryValuedLineDto[] = items.map((i) => ({
      itemId: i.id,
      itemCode: i.code,
      description: i.description,
      accountId: i.accountId,
      accountCode: i.accountCode,
      accountName: i.accountName,
      unit: i.unit,
      costMethod: i.costMethod,
      quantityOnHand: i.quantityOnHand,
      avgUnitCost: i.avgUnitCost,
      valuedBalance: i.valuedBalance,
    }));
    const totalValue = formatMoney(lines.reduce((s, l) => s + Number(l.valuedBalance), 0));
    return { lines, totalValue };
  }

  async getValuedBalanceByAccount(applicationId: string) {
    const { lines } = await this.getValuedBalance(applicationId);
    const byAccount = new Map<string, { accountCode: string; accountName: string; balance: number }>();
    for (const line of lines) {
      const key = line.accountCode;
      if (!byAccount.has(key)) {
        byAccount.set(key, {
          accountCode: line.accountCode,
          accountName: line.accountName,
          balance: 0,
        });
      }
      byAccount.get(key)!.balance += Number(line.valuedBalance);
    }
    return [...byAccount.values()]
      .map((a) => ({ ...a, balance: formatMoney(a.balance) }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  private async postMovementJournal(
    applicationId: string,
    item: { id: string; code: string; description: string; accountId: string; account: { code: string } },
    input: CreateInventoryMovementInput,
    movementType: string,
    absQty: number,
    unitCost: number,
    totalAmount: number,
    isInbound: boolean,
    createdBy?: string | null,
  ) {
    const inventoryAccountId = item.accountId;
    const cogsAccountId = await this.resolveAccountId(applicationId, CONTABILIDAD_INVENTORY_COGS_ACCOUNT_CODE);
    const description = `${movementType} inventario ${item.code} — ${item.description} (${absQty})`;

    if (isInbound) {
      const offsetType = input.offsetType ?? CONTABILIDAD_INVENTORY_OFFSET_TYPE.PAYABLE;
      const offsetCode =
        offsetType === CONTABILIDAD_INVENTORY_OFFSET_TYPE.EXPENSE
          ? CONTABILIDAD_INVENTORY_EXPENSE_ACCOUNT_CODE
          : CONTABILIDAD_PAYABLE_ACCOUNT_CODE;
      const offsetAccountId = await this.resolveAccountId(applicationId, offsetCode);
      return this.journal.createAndPost(
        applicationId,
        {
          periodId: input.periodId,
          entryDate: input.movementDate,
          description,
          lines: [
            { accountId: inventoryAccountId, debit: totalAmount },
            { accountId: offsetAccountId, credit: totalAmount },
          ],
        },
        createdBy,
      );
    }

    return this.journal.createAndPost(
      applicationId,
      {
        periodId: input.periodId,
        entryDate: input.movementDate,
        description,
        lines: [
          { accountId: cogsAccountId, debit: totalAmount },
          { accountId: inventoryAccountId, credit: totalAmount },
        ],
      },
      createdBy,
    );
  }

  private async resolveAccountId(applicationId: string, code: string): Promise<string> {
    const account = await this.prisma.contabilidadAccount.findFirst({
      where: { applicationId, code, isActive: true },
    });
    if (!account) throw new Error(`Cuenta ${code} no configurada en el plan de cuentas`);
    return account.id;
  }

  private async resolvePepsOutUnitCost(applicationId: string, itemId: string, qtyNeeded: number): Promise<number> {
    const batches = await this.prisma.contabilidadInventoryMovement.findMany({
      where: {
        applicationId,
        itemId,
        movementType: { in: [CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN, CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST] },
        remainingQty: { gt: 0 },
      },
      orderBy: [{ movementDate: 'asc' }, { createdAt: 'asc' }],
    });

    let remaining = qtyNeeded;
    let totalCost = 0;
    for (const batch of batches) {
      const available = Number(batch.remainingQty ?? 0);
      if (available <= 0) continue;
      const take = Math.min(remaining, available);
      totalCost += take * Number(batch.unitCost);
      remaining = roundQty(remaining - take);
      if (remaining <= 0.00005) break;
    }
    if (remaining > 0.00005) throw new Error('Lotes PEPS insuficientes para la salida');
    return roundQty(totalCost / qtyNeeded);
  }

  private async consumePepsBatchesTx(
    tx: Prisma.TransactionClient,
    itemId: string,
    qtyNeeded: number,
  ) {
    let remaining = qtyNeeded;
    const batches = await tx.contabilidadInventoryMovement.findMany({
      where: {
        itemId,
        movementType: { in: [CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN, CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST] },
        remainingQty: { gt: 0 },
      },
      orderBy: [{ movementDate: 'asc' }, { createdAt: 'asc' }],
    });

    for (const batch of batches) {
      if (remaining <= 0.00005) break;
      const available = Number(batch.remainingQty ?? 0);
      if (available <= 0) continue;
      const take = Math.min(remaining, available);
      const newRemaining = roundQty(available - take);
      await tx.contabilidadInventoryMovement.update({
        where: { id: batch.id },
        data: { remainingQty: newRemaining <= 0 ? 0 : newRemaining },
      });
      remaining = roundQty(remaining - take);
    }
  }

  private async buildKardexLines(
    applicationId: string,
    itemId: string,
  ): Promise<ContabilidadInventoryKardexLineDto[]> {
    const rows = await this.prisma.contabilidadInventoryMovement.findMany({
      where: { applicationId, itemId },
      orderBy: [{ movementDate: 'asc' }, { createdAt: 'asc' }],
    });

    let runQty = 0;
    let runValue = 0;
    const lines: ContabilidadInventoryKardexLineDto[] = [];

    for (const row of rows) {
      const qty = Number(row.quantity);
      const amount = Number(row.totalAmount);
      const isInbound =
        row.movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.IN ||
        (row.movementType === CONTABILIDAD_INVENTORY_MOVEMENT_TYPE.ADJUST && qty > 0);
      const absQty = Math.abs(qty);

      if (isInbound) {
        runQty = roundQty(runQty + absQty);
        runValue = roundPenAmount(runValue + amount);
      } else {
        runQty = roundQty(runQty - absQty);
        runValue = roundPenAmount(runValue - amount);
      }

      lines.push({
        id: row.id,
        movementDate: row.movementDate.toISOString().slice(0, 10),
        movementType: row.movementType,
        quantity: formatQty(qty),
        unitCost: formatQty(row.unitCost),
        totalAmount: formatMoney(amount),
        runningQuantity: formatQty(runQty),
        runningValue: formatMoney(runValue),
        notes: row.notes,
        journalEntryId: row.journalEntryId,
      });
    }
    return lines;
  }
}
