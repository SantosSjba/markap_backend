import type { ParsedInteriorBudgetWorkbook } from '../../application/ports/interior-budget-spreadsheet.port';
import type {
  ImportedBudgetRow,
  UpdateBudgetHeaderPayload,
} from '../../domain/repositories/interior-project-budget.repository';

/**
 * Lee una hoja (filas de celdas) con uno de los dos formatos de presupuesto de la clienta:
 *
 * - **Markap Spaces**: ITEM · Descripción · Costo · (Costo real) · Utilidad · Total · IGV · Precio.
 *   Jerarquía por texto: «PRIMER NIVEL» → ambiente («Sala») → categoría («Estructurales»,
 *   «Mobiliario:») → partidas. Texto que empieza en minúscula = nota de la partida anterior.
 * - **PRIZE**: ITEM · DESCRIPCION · UNIDAD · METRADO · P.U. · PARCIAL · TOTAL. «PRIMER NIVEL»
 *   agrupa partidas («1 OFICINAS», con total) que contienen ítems con código («1.0.1»). Se lee
 *   hasta «COSTO DIRECTO»; del pie salen GG + utilidad, tipo de cambio y «no incluyen IGV».
 *
 * El «Parcial» del Excel manda: si difiere de metrado × P.U. se guarda como costo directo.
 */

type Cell = unknown;

const str = (v: Cell): string =>
  typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';

function numOrNull(v: Cell): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/,/g, '').trim());
  return v.trim() && Number.isFinite(n) ? n : null;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const isAllCaps = (s: string) =>
  /[A-ZÁÉÍÓÚÑ]/.test(s) && s === s.toLocaleUpperCase('es-PE');
/** «PRIMER NIVEL», «PRIMER NIVEL y TERCER NIVEL»: primera palabra en mayúsculas y la palabra NIVEL */
const isLevelTitle = (s: string) =>
  /\bNIVEL\b/.test(s) && isAllCaps(s.split(/\s+/)[0] ?? '');

function findHeader(rows: Cell[][]) {
  const idx = rows.findIndex((r) =>
    r.some((c) => norm(str(c)).startsWith('descripcion')),
  );
  if (idx < 0) return null;
  const cols = rows[idx].map((c) => norm(str(c)));
  const find = (test: (h: string) => boolean) => cols.findIndex(test);
  return {
    idx,
    item: find((h) => h === 'item'),
    desc: find((h) => h.startsWith('descripcion')),
    unit: find((h) => h === 'unidad' || h === 'und' || h === 'und.'),
    qty: find((h) => h === 'metrado' || h === 'cantidad'),
    unitPrice: find(
      (h) => h === 'p.u.' || h === 'p.u' || h.startsWith('precio unit'),
    ),
    partial: find((h) => h === 'parcial'),
    total: find((h) => h === 'total'),
    cost: find((h) => h === 'costo'),
    actualCost: find((h) => h === 'costo real'),
    utility: find((h) => h === 'utilidad'),
    igv: find((h) => h === 'igv'),
  };
}

type Header = NonNullable<ReturnType<typeof findHeader>>;
const at = (row: Cell[], col: number) => (col >= 0 ? row[col] : undefined);

// ── Markap Spaces ──

function parseMarkapSpaces(
  rows: Cell[][],
  h: Header,
): ParsedInteriorBudgetWorkbook['budget'] {
  const root: ImportedBudgetRow[] = [];
  let level: ImportedBudgetRow | null = null;
  let space: ImportedBudgetRow | null = null;
  let category: ImportedBudgetRow | null = null;
  let lastWasGroup = false;
  let utilityPct: number | null = null;
  let igvPct: number | null = null;

  const group = (description: string): ImportedBudgetRow => ({
    kind: 'GROUP',
    description,
    children: [],
  });
  const container = () => category ?? space ?? level;
  const push = (row: ImportedBudgetRow) => {
    const parent = container();
    (parent ? parent.children! : root).push(row);
  };

  for (const row of rows.slice(h.idx + 1)) {
    const itemNo = str(at(row, h.item));
    const desc = str(at(row, h.desc));
    const cost = numOrNull(at(row, h.cost));
    if (
      /^total/i.test(itemNo) ||
      /^total/i.test(desc) ||
      norm(desc).startsWith('descripcion')
    )
      continue;
    if (!desc) continue;

    if (cost !== null || numOrNull(itemNo) !== null) {
      const utility = numOrNull(at(row, h.utility));
      const igv = numOrNull(at(row, h.igv));
      const total = numOrNull(at(row, h.total));
      if (utilityPct === null && cost && utility !== null)
        utilityPct = round2((utility / cost) * 100);
      if (igvPct === null && igv && total) igvPct = round2((igv / total) * 100);
      push({
        kind: 'ITEM',
        description: desc,
        directCost: cost,
        actualCost: numOrNull(at(row, h.actualCost)),
        hasIgv: (igv ?? 0) > 0,
      });
      lastWasGroup = false;
      continue;
    }

    if (/^[a-záéíóúñ]/.test(desc)) {
      push({ kind: 'NOTE', description: desc });
      continue;
    }
    if (isLevelTitle(desc)) {
      level = group(desc);
      root.push(level);
      space = category = null;
    } else if (desc.endsWith(':') || (lastWasGroup && space && !category)) {
      category = group(desc);
      ((space ?? level) ? (space ?? level)!.children! : root).push(category);
    } else {
      space = group(desc);
      category = null;
      (level ? level.children! : root).push(space);
    }
    lastWasGroup = true;
  }

  return {
    header: {
      marginMode: 'PER_LINE',
      utilityPct: utilityPct ?? undefined,
      igvMode: 'PER_LINE',
      igvPct: igvPct ?? undefined,
    },
    rows: root,
  };
}

// ── PRIZE ──

function parsePreamble(rows: Cell[][]): UpdateBudgetHeaderPayload {
  const header: UpdateBudgetHeaderPayload = {};
  for (const row of rows) {
    const text = row.map(str).filter(Boolean).join(' ');
    const number = /presupuesto\s*n[°º.]?\s*([\w.\-/]+)/i.exec(text);
    if (number) header.number = number[1];
    const executes = /^ejecuta\s*:\s*(.+)$/i.exec(text);
    if (executes) header.executedBy = executes[1].trim();
    const term = /^plazo de ejecuci[oó]n\s*:\s*(.+)$/i.exec(text);
    if (term) header.executionTerm = term[1].trim();
    const date = /^fecha\s*:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(text);
    if (date)
      header.issuedAt = new Date(Date.UTC(+date[3], +date[2] - 1, +date[1]));
  }
  return header;
}

function parsePrize(
  rows: Cell[][],
  h: Header,
  warnings: string[],
): ParsedInteriorBudgetWorkbook['budget'] {
  const header: UpdateBudgetHeaderPayload = {
    ...parsePreamble(rows.slice(0, h.idx)),
    marginMode: 'GLOBAL',
    igvMode: 'NONE',
  };
  const root: ImportedBudgetRow[] = [];
  let level: ImportedBudgetRow | null = null;
  let partida: ImportedBudgetRow | null = null;
  const body = rows.slice(h.idx + 1);
  let end = body.length;

  for (const [i, row] of body.entries()) {
    const code = str(at(row, h.item));
    const desc = str(at(row, h.desc));
    if (/^costo directo/i.test(code) || /^costo directo/i.test(desc)) {
      end = i;
      break;
    }
    if (!code && !desc) continue;
    const unit = str(at(row, h.unit)) || null;
    const qty = numOrNull(at(row, h.qty));
    const unitPrice = numOrNull(at(row, h.unitPrice));
    const partial = numOrNull(at(row, h.partial));
    const total = numOrNull(at(row, h.total));
    const hasItemData =
      unit !== null || qty !== null || unitPrice !== null || partial !== null;

    if (!code && !hasItemData && total === null) {
      level = { kind: 'GROUP', description: desc, children: [] };
      root.push(level);
      partida = null;
    } else if (code && !hasItemData && total !== null) {
      partida = { kind: 'GROUP', code, description: desc, children: [] };
      (level ? level.children! : root).push(partida);
    } else if (!hasItemData) {
      (partida ?? level)?.children!.push({
        kind: 'NOTE',
        description: `${code} ${desc}`.trim(),
      });
    } else {
      const product =
        qty !== null && unitPrice !== null ? round2(qty * unitPrice) : null;
      let directCost: number | null = null;
      if (partial !== null) {
        directCost =
          product !== null && Math.abs(product - partial) < 0.005
            ? null
            : partial;
      } else if (product) {
        directCost = 0;
        warnings.push(
          `${code} «${desc}»: sin parcial en el Excel (metrado × P.U. = ${product}); se importó con costo 0.`,
        );
      }
      const item: ImportedBudgetRow = {
        kind: 'ITEM',
        code: code || null,
        description: desc,
        unit,
        quantity: qty,
        unitPrice,
        directCost,
      };
      ((partida ?? level) ? (partida ?? level)!.children! : root).push(item);
    }
  }

  // Pie: GG + utilidad («20% + 1%»), tipo de cambio e IGV
  for (const row of body.slice(end)) {
    const text = row.map(str).filter(Boolean).join(' ');
    const pcts =
      /gastos generales.*?([\d.,]+)\s*%(?:\s*\+\s*([\d.,]+)\s*%)?/i.exec(text);
    if (pcts) {
      const values = [pcts[1], pcts[2]]
        .filter((v): v is string => Boolean(v))
        .map((v) => Number(v.replace(',', '.')));
      header.utilityPct = Math.max(...values);
      header.overheadPct = values.length > 1 ? Math.min(...values) : 0;
    }
    const rate = /tipo de cambio\s*([\d.,]+)/i.exec(text);
    if (rate) header.exchangeRate = Number(rate[1].replace(',', '.'));
    if (
      /igv/i.test(text) &&
      !/no incluye/i.test(text) &&
      header.igvMode === 'NONE'
    ) {
      header.igvMode = 'GLOBAL';
    }
  }
  return { header, rows: root };
}

const countItems = (rows: ImportedBudgetRow[]): number =>
  rows.reduce(
    (n, r) => n + (r.kind === 'ITEM' ? 1 : 0) + countItems(r.children ?? []),
    0,
  );

export function parseInteriorBudgetRows(
  rows: Cell[][],
  sheetName: string,
): ParsedInteriorBudgetWorkbook {
  const h = findHeader(rows);
  if (!h || h.desc < 0) {
    return {
      sheetName,
      format: 'MARKAP_SPACES',
      budget: { header: {}, rows: [] },
      warnings: [],
    };
  }
  const warnings: string[] = [];
  const isPrize = h.qty >= 0 || h.unitPrice >= 0;
  return {
    sheetName,
    format: isPrize ? 'PRIZE' : 'MARKAP_SPACES',
    budget: isPrize
      ? parsePrize(rows, h, warnings)
      : parseMarkapSpaces(rows, h),
    warnings,
  };
}

/** De varias hojas, la que tenga más partidas (en el Excel de Markap Spaces, la más completa). */
export function pickBestSheet(
  sheets: { name: string; rows: Cell[][] }[],
): ParsedInteriorBudgetWorkbook | null {
  let best: ParsedInteriorBudgetWorkbook | null = null;
  for (const s of sheets) {
    const parsed = parseInteriorBudgetRows(s.rows, s.name);
    if (!best || countItems(parsed.budget.rows) > countItems(best.budget.rows))
      best = parsed;
  }
  return best && countItems(best.budget.rows) > 0 ? best : null;
}
