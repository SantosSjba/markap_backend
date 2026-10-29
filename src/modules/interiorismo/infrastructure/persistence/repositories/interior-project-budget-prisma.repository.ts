import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { formatDateOnly } from '../../../../../shared/domain/utils/peru-date.util';
import { computeProjectSettlement } from '../../../domain/budget/project-settlement.calculator';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  computeBudgetSheet,
  round2,
  type BudgetIgvMode,
  type BudgetMarginMode,
  type BudgetRowKind,
} from '../../../domain/budget/budget-sheet.calculator';
import type {
  BudgetRowFields,
  BudgetRowPosition,
  BudgetRowStatus,
  BudgetSheetDto,
  BudgetStatus,
  ImportedBudget,
  ImportedBudgetRow,
  InteriorProjectBudgetRepository,
  ProjectSettlementDto,
  UpdateBudgetHeaderPayload,
} from '../../../domain/repositories/interior-project-budget.repository';

type Tx = Prisma.TransactionClient;

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function dec(v: number | null | undefined): Prisma.Decimal | null | undefined {
  if (v === undefined) return undefined;
  return v === null ? null : new Prisma.Decimal(v);
}

const text = (v: string | null | undefined) =>
  v === undefined ? undefined : v?.trim() || null;

/** Campos de fila → columnas Prisma (solo los enviados) */
function rowData(f: BudgetRowFields) {
  return {
    kind: f.kind,
    code: text(f.code),
    description: f.description === undefined ? undefined : f.description.trim(),
    unit: text(f.unit),
    quantity: dec(f.quantity),
    unitPrice: dec(f.unitPrice),
    directCost: dec(f.directCost),
    actualCost: dec(f.actualCost),
    utilityPctOverride: dec(f.utilityPctOverride),
    hasIgv: f.hasIgv,
    supplierId: f.supplierId === undefined ? undefined : f.supplierId || null,
    supplierName: text(f.supplierName),
    status: f.status,
    note: text(f.note),
  };
}

@Injectable()
export class InteriorProjectBudgetPrismaRepository implements InteriorProjectBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Alcance ──

  private async assertProject(
    projectId: string,
    applicationSlug = 'interiorismo',
  ) {
    const project = await this.prisma.interiorProject.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        application: { slug: applicationSlug },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  /** Presupuesto activo del proyecto; si no existe se crea la v1 con los valores del proyecto */
  private async activeBudgetId(
    projectId: string,
    applicationSlug?: string,
  ): Promise<string> {
    const project = await this.assertProject(projectId, applicationSlug);
    const active = await this.prisma.interiorBudget.findFirst({
      where: { projectId, isActive: true },
      select: { id: true },
    });
    if (active) return active.id;
    const last = await this.prisma.interiorBudget.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (last) {
      await this.prisma.interiorBudget.update({
        where: { id: last.id },
        data: { isActive: true },
      });
      return last.id;
    }
    const created = await this.prisma.interiorBudget.create({
      data: {
        projectId,
        version: 1,
        isActive: true,
        currency: project.currency,
        exchangeRate: project.exchangeRate,
        utilityPct: project.defaultUtilityPct,
        overheadPct: project.defaultOverheadPct,
        igvPct: project.defaultIgvPct,
        marginMode: num(project.defaultOverheadPct) > 0 ? 'GLOBAL' : 'PER_LINE',
      },
    });
    return created.id;
  }

  private async findRow(budgetId: string, rowId: string) {
    const row = await this.prisma.interiorBudgetRow.findFirst({
      where: { id: rowId, budgetId },
    });
    if (!row) throw new NotFoundException('Fila del presupuesto no encontrada');
    return row;
  }

  private async assertParent(budgetId: string, parentId: string | null) {
    if (!parentId) return;
    const parent = await this.findRow(budgetId, parentId);
    if (parent.kind !== 'GROUP') {
      throw new BadRequestException('Solo un grupo puede contener filas');
    }
  }

  // ── Hoja ──

  private async buildSheet(budgetId: string): Promise<BudgetSheetDto> {
    const budget = await this.prisma.interiorBudget.findUniqueOrThrow({
      where: { id: budgetId },
      include: {
        project: {
          select: { id: true, code: true, name: true, currency: true },
        },
        rows: { include: { supplierPayments: { orderBy: { paidAt: 'asc' } } } },
      },
    });
    const versions = await this.prisma.interiorBudget.findMany({
      where: { projectId: budget.projectId },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        version: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
    });

    const header = {
      currency: budget.currency,
      exchangeRate: numOrNull(budget.exchangeRate),
      marginMode: budget.marginMode as BudgetMarginMode,
      utilityPct: num(budget.utilityPct),
      overheadPct: num(budget.overheadPct),
      igvMode: budget.igvMode as BudgetIgvMode,
      igvPct: num(budget.igvPct),
    };
    const byId = new Map(budget.rows.map((r) => [r.id, r]));
    const sheet = computeBudgetSheet(
      header,
      budget.rows.map((r) => ({
        id: r.id,
        parentId: r.parentId,
        sortOrder: r.sortOrder,
        kind: r.kind as BudgetRowKind,
        code: r.code,
        description: r.description,
        unit: r.unit,
        quantity: numOrNull(r.quantity),
        unitPrice: numOrNull(r.unitPrice),
        directCost: numOrNull(r.directCost),
        actualCost: numOrNull(r.actualCost),
        utilityPctOverride: numOrNull(r.utilityPctOverride),
        hasIgv: r.hasIgv,
        supplierPaymentsTotal: round2(
          r.supplierPayments.reduce((s, p) => s + num(p.amount), 0),
        ),
      })),
    );

    return {
      project: budget.project,
      budget: {
        id: budget.id,
        projectId: budget.projectId,
        version: budget.version,
        isActive: budget.isActive,
        number: budget.number,
        issuedAt: budget.issuedAt ? formatDateOnly(budget.issuedAt) : null,
        executionTerm: budget.executionTerm,
        executedBy: budget.executedBy,
        status: budget.status as BudgetStatus,
        ...header,
        exchangeRateDate: budget.exchangeRateDate
          ? formatDateOnly(budget.exchangeRateDate)
          : null,
        terms: budget.terms,
        visibleColumns: Array.isArray(budget.visibleColumns)
          ? (budget.visibleColumns as string[])
          : null,
      },
      versions: versions.map((v) => ({
        ...v,
        status: v.status as BudgetStatus,
        createdAt: v.createdAt.toISOString(),
      })),
      rows: sheet.rows.map((r) => {
        const raw = byId.get(r.id)!;
        return {
          ...r,
          manualCode: raw.code,
          status: raw.status as BudgetRowStatus,
          note: raw.note,
          supplierId: raw.supplierId,
          supplierName: raw.supplierName,
          supplierPayments: raw.supplierPayments.map((p) => ({
            id: p.id,
            amount: num(p.amount),
            paidAt: formatDateOnly(p.paidAt),
            note: p.note,
          })),
        };
      }),
      totals: sheet.totals,
    };
  }

  async getSheet(projectId: string, applicationSlug?: string) {
    return this.buildSheet(
      await this.activeBudgetId(projectId, applicationSlug),
    );
  }

  async getSettlement(
    projectId: string,
    applicationSlug?: string,
  ): Promise<ProjectSettlementDto> {
    const sheet = await this.getSheet(projectId, applicationSlug);
    const payments = await this.prisma.interiorProjectPayment.findMany({
      where: { projectId },
      select: {
        amount: true,
        currency: true,
        exchangeRate: true,
        paymentType: true,
        status: true,
      },
    });
    return computeProjectSettlement(
      {
        ...sheet.totals,
        supplierBalance: sheet.rows
          .filter(
            (r) =>
              r.kind === 'ITEM' &&
              (r.supplierId ||
                r.supplierName?.trim() ||
                r.supplierPaymentsTotal > 0),
          )
          .reduce((sum, r) => sum + Math.max(0, r.supplierBalance ?? 0), 0),
      },
      {
        currency: sheet.budget.currency,
        exchangeRate: sheet.budget.exchangeRate,
      },
      payments.map((p) => ({
        amount: num(p.amount),
        currency: p.currency,
        exchangeRate: numOrNull(p.exchangeRate),
        paymentType: p.paymentType,
        status: p.status,
      })),
    );
  }

  async updateHeader(
    projectId: string,
    p: UpdateBudgetHeaderPayload,
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    await this.prisma.interiorBudget.update({
      where: { id: budgetId },
      data: {
        number: text(p.number),
        issuedAt: p.issuedAt,
        executionTerm: text(p.executionTerm),
        executedBy: text(p.executedBy),
        status: p.status,
        currency: p.currency,
        exchangeRate: dec(p.exchangeRate),
        exchangeRateDate: p.exchangeRateDate,
        marginMode: p.marginMode,
        utilityPct: dec(p.utilityPct) ?? undefined,
        overheadPct: dec(p.overheadPct) ?? undefined,
        igvMode: p.igvMode,
        igvPct: dec(p.igvPct) ?? undefined,
        terms: text(p.terms),
        visibleColumns:
          p.visibleColumns === undefined
            ? undefined
            : p.visibleColumns === null
              ? Prisma.DbNull
              : p.visibleColumns,
      },
    });
    return this.buildSheet(budgetId);
  }

  // ── Filas ──

  /** Renumera los hermanos de `parentId` con el orden dado */
  private async renumber(tx: Tx, ids: string[]) {
    await Promise.all(
      ids.map((id, i) =>
        tx.interiorBudgetRow.update({ where: { id }, data: { sortOrder: i } }),
      ),
    );
  }

  private async siblingIds(tx: Tx, budgetId: string, parentId: string | null) {
    const rows = await tx.interiorBudgetRow.findMany({
      where: { budgetId, parentId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async createRows(
    projectId: string,
    position: BudgetRowPosition,
    rows: BudgetRowFields[],
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    await this.assertParent(budgetId, position.parentId);
    if (!rows.length)
      throw new BadRequestException('No hay filas para agregar');

    const createdRowIds = rows.map(() => randomUUID());
    await this.prisma.$transaction(async (tx) => {
      const siblings = await this.siblingIds(tx, budgetId, position.parentId);
      const afterIdx = position.afterRowId
        ? siblings.indexOf(position.afterRowId)
        : siblings.length - 1;
      if (position.afterRowId && afterIdx < 0) {
        throw new BadRequestException(
          'La fila de referencia no está en ese grupo',
        );
      }
      for (const [i, fields] of rows.entries()) {
        await tx.interiorBudgetRow.create({
          data: {
            ...rowData(fields),
            id: createdRowIds[i],
            budgetId,
            parentId: position.parentId,
            kind: fields.kind ?? 'ITEM',
            description: fields.description?.trim() ?? '',
          },
        });
      }
      siblings.splice(afterIdx + 1, 0, ...createdRowIds);
      await this.renumber(tx, siblings);
    });
    return { ...(await this.buildSheet(budgetId)), createdRowIds };
  }

  async updateRow(
    projectId: string,
    rowId: string,
    payload: BudgetRowFields,
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const row = await this.findRow(budgetId, rowId);
    if (payload.kind && payload.kind !== 'GROUP' && row.kind === 'GROUP') {
      const kids = await this.prisma.interiorBudgetRow.count({
        where: { parentId: rowId },
      });
      if (kids) {
        throw new BadRequestException(
          'El grupo tiene filas dentro; muévalas antes de convertirlo',
        );
      }
    }
    if (payload.supplierId) {
      const supplier = await this.prisma.interiorMaterialSupplier.findUnique({
        where: { id: payload.supplierId },
        select: { companyName: true },
      });
      if (!supplier) throw new BadRequestException('Proveedor no válido');
      payload = { ...payload, supplierName: supplier.companyName };
    }
    await this.prisma.interiorBudgetRow.update({
      where: { id: rowId },
      data: rowData(payload),
    });
    return this.buildSheet(budgetId);
  }

  async moveRow(
    projectId: string,
    rowId: string,
    target: { parentId: string | null; index: number },
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const row = await this.findRow(budgetId, rowId);
    await this.assertParent(budgetId, target.parentId);

    // No se puede meter un grupo dentro de sí mismo ni de sus descendientes
    for (let id = target.parentId; id; ) {
      if (id === rowId) {
        throw new BadRequestException(
          'Un grupo no puede ir dentro de sí mismo',
        );
      }
      id = (await this.findRow(budgetId, id)).parentId;
    }

    await this.prisma.$transaction(async (tx) => {
      const oldSiblings = (
        await this.siblingIds(tx, budgetId, row.parentId)
      ).filter((id) => id !== rowId);
      await tx.interiorBudgetRow.update({
        where: { id: rowId },
        data: { parentId: target.parentId },
      });
      const newSiblings =
        row.parentId === target.parentId
          ? oldSiblings
          : (await this.siblingIds(tx, budgetId, target.parentId)).filter(
              (id) => id !== rowId,
            );
      const index = Math.max(0, Math.min(target.index, newSiblings.length));
      newSiblings.splice(index, 0, rowId);
      await this.renumber(tx, newSiblings);
      if (row.parentId !== target.parentId)
        await this.renumber(tx, oldSiblings);
    });
    return this.buildSheet(budgetId);
  }

  async deleteRow(projectId: string, rowId: string, applicationSlug?: string) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const row = await this.findRow(budgetId, rowId);
    await this.prisma.$transaction(async (tx) => {
      await tx.interiorBudgetRow.delete({ where: { id: rowId } });
      await this.renumber(
        tx,
        await this.siblingIds(tx, budgetId, row.parentId),
      );
    });
    return this.buildSheet(budgetId);
  }

  async addSupplierPayment(
    projectId: string,
    rowId: string,
    payload: { amount: number; paidAt: Date; note?: string | null },
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const row = await this.findRow(budgetId, rowId);
    if (row.kind !== 'ITEM') {
      throw new BadRequestException('Solo las partidas reciben abonos');
    }
    await this.prisma.interiorBudgetRowSupplierPayment.create({
      data: {
        rowId,
        amount: new Prisma.Decimal(payload.amount),
        paidAt: payload.paidAt,
        note: text(payload.note) ?? null,
      },
    });
    return this.buildSheet(budgetId);
  }

  async deleteSupplierPayment(
    projectId: string,
    paymentId: string,
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const payment =
      await this.prisma.interiorBudgetRowSupplierPayment.findFirst({
        where: { id: paymentId, row: { budgetId } },
      });
    if (!payment) throw new NotFoundException('Abono no encontrado');
    await this.prisma.interiorBudgetRowSupplierPayment.delete({
      where: { id: paymentId },
    });
    return this.buildSheet(budgetId);
  }

  // ── Versiones ──

  async duplicateActive(projectId: string, applicationSlug?: string) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const source = await this.prisma.interiorBudget.findUniqueOrThrow({
      where: { id: budgetId },
      include: { rows: { include: { supplierPayments: true } } },
    });
    const last = await this.prisma.interiorBudget.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const newId = randomUUID();
    const idMap = new Map(source.rows.map((r) => [r.id, randomUUID()]));

    await this.prisma.$transaction(async (tx) => {
      await tx.interiorBudget.updateMany({
        where: { projectId },
        data: { isActive: false },
      });
      await tx.interiorBudget.create({
        data: {
          id: newId,
          projectId,
          version: (last?.version ?? 0) + 1,
          isActive: true,
          status: 'DRAFT',
          number: source.number,
          issuedAt: source.issuedAt,
          executionTerm: source.executionTerm,
          executedBy: source.executedBy,
          currency: source.currency,
          exchangeRate: source.exchangeRate,
          exchangeRateDate: source.exchangeRateDate,
          marginMode: source.marginMode,
          utilityPct: source.utilityPct,
          overheadPct: source.overheadPct,
          igvMode: source.igvMode,
          igvPct: source.igvPct,
          terms: source.terms,
          visibleColumns: source.visibleColumns ?? Prisma.DbNull,
        },
      });
      // Padres antes que hijos: se crean sin padre y luego se enlazan
      for (const r of source.rows) {
        await tx.interiorBudgetRow.create({
          data: {
            id: idMap.get(r.id)!,
            budgetId: newId,
            parentId: null,
            sortOrder: r.sortOrder,
            kind: r.kind,
            code: r.code,
            description: r.description,
            unit: r.unit,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            directCost: r.directCost,
            actualCost: r.actualCost,
            utilityPctOverride: r.utilityPctOverride,
            hasIgv: r.hasIgv,
            supplierId: r.supplierId,
            supplierName: r.supplierName,
            status: r.status,
            note: r.note,
          },
        });
        for (const p of r.supplierPayments) {
          await tx.interiorBudgetRowSupplierPayment.create({
            data: {
              rowId: idMap.get(r.id)!,
              amount: p.amount,
              paidAt: p.paidAt,
              note: p.note,
            },
          });
        }
      }
      for (const r of source.rows.filter((x) => x.parentId)) {
        await tx.interiorBudgetRow.update({
          where: { id: idMap.get(r.id)! },
          data: { parentId: idMap.get(r.parentId!) ?? null },
        });
      }
    });
    return this.buildSheet(newId);
  }

  async activateVersion(
    projectId: string,
    budgetId: string,
    applicationSlug?: string,
  ) {
    await this.assertProject(projectId, applicationSlug);
    const target = await this.prisma.interiorBudget.findFirst({
      where: { id: budgetId, projectId },
    });
    if (!target) throw new NotFoundException('Versión no encontrada');
    await this.prisma.$transaction([
      this.prisma.interiorBudget.updateMany({
        where: { projectId },
        data: { isActive: false },
      }),
      this.prisma.interiorBudget.update({
        where: { id: budgetId },
        data: { isActive: true },
      }),
    ]);
    return this.buildSheet(budgetId);
  }

  // ── Importación / sincronización ──

  async importRows(
    projectId: string,
    imported: ImportedBudget,
    replace: boolean,
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    let rowsCreated = 0;
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.interiorBudgetRow.count({
        where: { budgetId },
      });
      if (replace) {
        await tx.interiorBudgetRow.deleteMany({
          where: { budgetId, parentId: null },
        });
      }
      // La cabecera del Excel se aplica al reemplazar o si el presupuesto estaba vacío
      if (replace || existing === 0) {
        const h = imported.header;
        await tx.interiorBudget.update({
          where: { id: budgetId },
          data: {
            number: text(h.number),
            issuedAt: h.issuedAt,
            executionTerm: text(h.executionTerm),
            executedBy: text(h.executedBy),
            exchangeRate: dec(h.exchangeRate),
            marginMode: h.marginMode,
            utilityPct: dec(h.utilityPct) ?? undefined,
            overheadPct: dec(h.overheadPct) ?? undefined,
            igvMode: h.igvMode,
            igvPct: dec(h.igvPct) ?? undefined,
          },
        });
      }
      let rootOrder = replace
        ? 0
        : await tx.interiorBudgetRow.count({
            where: { budgetId, parentId: null },
          });
      const insert = async (
        list: ImportedBudgetRow[],
        parentId: string | null,
        start: number,
      ) => {
        for (const [i, r] of list.entries()) {
          const id = randomUUID();
          const { children, ...fields } = r;
          await tx.interiorBudgetRow.create({
            data: {
              ...rowData(fields),
              id,
              budgetId,
              parentId,
              sortOrder: start + i,
              kind: r.kind,
              description: r.description.trim(),
            },
          });
          rowsCreated++;
          if (children?.length) await insert(children, id, 0);
        }
      };
      await insert(imported.rows, null, rootOrder);
      rootOrder += imported.rows.length;
    });
    return { ...(await this.buildSheet(budgetId)), rowsCreated };
  }

  async syncActualCostsFromExecution(
    projectId: string,
    applicationSlug?: string,
  ) {
    const budgetId = await this.activeBudgetId(projectId, applicationSlug);
    const costs = await this.prisma.interiorExecutionActualCost.findMany({
      where: {
        projectId,
        costCategory: { in: ['MATERIAL', 'EXPENSE', 'TRANSPORT'] },
      },
    });
    const amountByConcept = new Map<string, number>();
    const displayByConcept = new Map<string, string>();
    for (const cost of costs) {
      const key = cost.concept.trim().toLowerCase();
      if (!key) continue;
      amountByConcept.set(
        key,
        (amountByConcept.get(key) ?? 0) + num(cost.amount),
      );
      if (!displayByConcept.has(key))
        displayByConcept.set(key, cost.concept.trim());
    }
    const items = await this.prisma.interiorBudgetRow.findMany({
      where: { budgetId, kind: 'ITEM' },
      select: { id: true, description: true },
    });
    const matched = new Set<string>();
    let updatedRows = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const key = item.description.trim().toLowerCase();
        const amount = amountByConcept.get(key);
        if (amount == null) continue;
        await tx.interiorBudgetRow.update({
          where: { id: item.id },
          data: { actualCost: new Prisma.Decimal(round2(amount)) },
        });
        matched.add(key);
        updatedRows++;
      }
    });
    return {
      updatedRows,
      unmatchedConcepts: [...amountByConcept.keys()]
        .filter((k) => !matched.has(k))
        .map((k) => displayByConcept.get(k) ?? k),
      sheet: await this.buildSheet(budgetId),
    };
  }

  async assertProjectExists(projectId: string, applicationSlug?: string) {
    await this.assertProject(projectId, applicationSlug);
  }

  async assertRowBelongsToProject(
    projectId: string,
    rowId: string,
    applicationSlug?: string,
  ) {
    await this.assertProject(projectId, applicationSlug);
    const row = await this.prisma.interiorBudgetRow.findFirst({
      where: { id: rowId, budget: { projectId } },
      select: { id: true },
    });
    if (!row)
      throw new NotFoundException('Partida no encontrada en el proyecto');
  }
}
