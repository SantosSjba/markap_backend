/**
 * Cálculo del presupuesto tipo hoja (modelo de los Excel de la clienta).
 *
 * - Markap Spaces: utilidad por línea (`PER_LINE`) e IGV solo en algunas partidas.
 * - PRIZE: metrado × P.U., gastos generales + utilidad al final (`GLOBAL`), sin IGV.
 *
 * Costo de una partida = `directCost` si se escribió (sobrescribe, como el «Parcial» manual del
 * Excel) o `quantity × unitPrice`. Los montos derivados no se guardan en BD.
 */

export type BudgetMarginMode = 'PER_LINE' | 'GLOBAL';
export type BudgetIgvMode = 'PER_LINE' | 'GLOBAL' | 'NONE';
export type BudgetRowKind = 'GROUP' | 'ITEM' | 'NOTE';

export interface BudgetHeaderInput {
  currency: string;
  /** Soles por unidad de moneda extranjera (ej. 3.50 por US$) */
  exchangeRate: number | null;
  marginMode: BudgetMarginMode;
  utilityPct: number;
  overheadPct: number;
  igvMode: BudgetIgvMode;
  igvPct: number;
}

export interface BudgetRowInput {
  id: string;
  parentId: string | null;
  sortOrder: number;
  kind: BudgetRowKind;
  /** Código manual (ej. «A», «1.0.1»); vacío = automático */
  code: string | null;
  description: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  directCost: number | null;
  actualCost: number | null;
  utilityPctOverride: number | null;
  hasIgv: boolean;
  supplierPaymentsTotal: number;
}

export interface ComputedBudgetRow extends BudgetRowInput {
  /** Código mostrado (manual o automático; las notas no llevan) */
  code: string;
  depth: number;
  childrenCount: number;
  cost: number;
  utility: number;
  total: number;
  igv: number;
  price: number;
  /** costo presupuestado − costo real (ítems con costo real) */
  deviation: number | null;
  /** costo real − abonos al proveedor */
  supplierBalance: number | null;
}

export interface BudgetCurrencyAmount {
  currency: string;
  amount: number;
}

export interface BudgetSheetTotals {
  directCost: number;
  utility: number;
  overhead: number;
  subtotal: number;
  igv: number;
  total: number;
  actualCost: number;
  /** Costo presupuestado de las partidas que aún no tienen costo real */
  pendingCost: number;
  supplierPayments: number;
  /** Total en la otra moneda según el tipo de cambio (PEN ↔ USD/EUR) */
  equivalent: BudgetCurrencyAmount | null;
}

export interface ComputedBudgetSheet {
  /** Filas en orden de lectura (padre antes que hijos) */
  rows: ComputedBudgetRow[];
  totals: BudgetSheetTotals;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function itemCost(r: BudgetRowInput): number {
  if (r.directCost != null) return round2(r.directCost);
  if (r.quantity != null && r.unitPrice != null)
    return round2(r.quantity * r.unitPrice);
  return 0;
}

/** Recorre el árbol en orden de lectura; huérfanos (padre inexistente) van a la raíz. */
function orderTree(rows: BudgetRowInput[]) {
  const ids = new Set(rows.map((r) => r.id));
  const children = new Map<string | null, BudgetRowInput[]>();
  for (const r of rows) {
    const parent = r.parentId && ids.has(r.parentId) ? r.parentId : null;
    const list = children.get(parent) ?? [];
    list.push(r);
    children.set(parent, list);
  }
  for (const list of children.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }
  const ordered: { row: BudgetRowInput; depth: number; autoCode: string }[] =
    [];
  const walk = (parent: string | null, depth: number, prefix: string) => {
    let n = 0;
    for (const r of children.get(parent) ?? []) {
      const autoCode = r.kind === 'NOTE' ? '' : `${prefix}${++n}`;
      ordered.push({ row: r, depth, autoCode });
      walk(r.id, depth + 1, autoCode ? `${autoCode}.` : prefix);
    }
  };
  walk(null, 0, '');
  return { ordered, children };
}

export function computeBudgetSheet(
  header: BudgetHeaderInput,
  rows: BudgetRowInput[],
): ComputedBudgetSheet {
  const perLine = header.marginMode === 'PER_LINE';
  const { ordered, children } = orderTree(rows);

  const computed = new Map<string, ComputedBudgetRow>();
  for (const { row, depth, autoCode } of ordered) {
    const isItem = row.kind === 'ITEM';
    const cost = isItem ? itemCost(row) : 0;
    const utilityPct = row.utilityPctOverride ?? header.utilityPct;
    const utility = isItem && perLine ? round2((cost * utilityPct) / 100) : 0;
    const total = round2(cost + utility);
    const igv =
      isItem && header.igvMode === 'PER_LINE' && row.hasIgv
        ? round2((total * header.igvPct) / 100)
        : 0;
    computed.set(row.id, {
      ...row,
      code: row.kind === 'NOTE' ? '' : row.code?.trim() || autoCode,
      depth,
      childrenCount: (children.get(row.id) ?? []).length,
      cost,
      utility,
      total,
      igv,
      price: round2(total + igv),
      deviation:
        isItem && row.actualCost != null ? round2(cost - row.actualCost) : null,
      supplierBalance:
        isItem && row.actualCost != null
          ? round2(row.actualCost - row.supplierPaymentsTotal)
          : null,
    });
  }

  // Subtotales de grupo: de las hojas hacia arriba (orden inverso de lectura)
  for (let i = ordered.length - 1; i >= 0; i--) {
    const row = computed.get(ordered[i].row.id)!;
    if (row.kind !== 'GROUP') continue;
    const kids = (children.get(row.id) ?? []).map((k) => computed.get(k.id)!);
    row.cost = round2(kids.reduce((s, k) => s + k.cost, 0));
    row.utility = round2(kids.reduce((s, k) => s + k.utility, 0));
    row.total = round2(kids.reduce((s, k) => s + k.total, 0));
    row.igv = round2(kids.reduce((s, k) => s + k.igv, 0));
    row.price = round2(kids.reduce((s, k) => s + k.price, 0));
  }

  const items = [...computed.values()].filter((r) => r.kind === 'ITEM');
  const sum = (pick: (r: ComputedBudgetRow) => number) =>
    round2(items.reduce((s, r) => s + pick(r), 0));

  const directCost = sum((r) => r.cost);
  const utility = perLine
    ? sum((r) => r.utility)
    : round2((directCost * header.utilityPct) / 100);
  const overhead = round2((directCost * header.overheadPct) / 100);
  const subtotal = round2(directCost + utility + overhead);
  const igv =
    header.igvMode === 'PER_LINE'
      ? sum((r) => r.igv)
      : header.igvMode === 'GLOBAL'
        ? round2((subtotal * header.igvPct) / 100)
        : 0;
  const total = round2(subtotal + igv);

  let equivalent: BudgetCurrencyAmount | null = null;
  if (header.exchangeRate && header.exchangeRate > 0) {
    equivalent =
      header.currency === 'PEN'
        ? { currency: 'USD', amount: round2(total / header.exchangeRate) }
        : { currency: 'PEN', amount: round2(total * header.exchangeRate) };
  }

  return {
    rows: ordered.map((o) => computed.get(o.row.id)!),
    totals: {
      directCost,
      utility,
      overhead,
      subtotal,
      igv,
      total,
      actualCost: sum((r) => r.actualCost ?? 0),
      pendingCost: sum((r) => (r.actualCost == null ? r.cost : 0)),
      supplierPayments: sum((r) => r.supplierPaymentsTotal),
      equivalent,
    },
  };
}
