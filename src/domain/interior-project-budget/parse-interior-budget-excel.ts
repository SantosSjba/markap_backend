import * as XLSX from 'xlsx';

export interface ParsedBudgetLineItem {
  description: string;
  budgetedCost: number;
  hasIgv: boolean;
}

export interface ParsedBudgetSection {
  name: string;
  lineItems: ParsedBudgetLineItem[];
}

export interface ParseInteriorBudgetExcelResult {
  sheetName: string;
  sections: ParsedBudgetSection[];
}

function cellStr(value: unknown): string {
  return String(value ?? '').trim();
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function isEmptyCell(value: unknown): boolean {
  return value === null || value === undefined || cellStr(value) === '';
}

function rowIsSectionHeader(row: unknown[], descCol: number, costCol: number): boolean {
  const desc = cellStr(row[descCol]);
  if (!desc) return false;
  if (parseNumber(row[costCol]) !== null) return false;
  for (let c = 0; c < row.length; c++) {
    if (c === descCol) continue;
    if (!isEmptyCell(row[c]) && parseNumber(row[c]) !== null) return false;
  }
  return true;
}

function shouldSkipRow(desc: string): boolean {
  const lower = desc.toLowerCase();
  return (
    lower.startsWith('total') ||
    lower.startsWith('presupuesto') ||
    lower.startsWith('sub total') ||
    lower.startsWith('subtotal') ||
    lower === 'a cuenta' ||
    lower === 'descripción' ||
    lower === 'descripcion'
  );
}

function detectColumns(rows: unknown[][]): {
  headerIdx: number;
  descCol: number;
  costCol: number;
  igvCol: number;
} {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i] ?? [];
    const labels = row.map((c) => cellStr(c).toLowerCase());
    const descCol = labels.findIndex((c) => c.includes('descrip') || c === 'partida');
    const costCol = labels.findIndex(
      (c) => (c.includes('costo') || c === 'cost') && !c.includes('real') && !c.includes('compra'),
    );
    if (descCol >= 0 && costCol >= 0) {
      const igvCol = labels.findIndex((c) => c.includes('igv'));
      return { headerIdx: i, descCol, costCol, igvCol };
    }
  }
  return { headerIdx: 0, descCol: 0, costCol: 1, igvCol: -1 };
}

export function parseInteriorBudgetExcel(buffer: Buffer): ParseInteriorBudgetExcelResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName =
    workbook.SheetNames.find((name) => /proyecto|presupuesto|hortensias/i.test(name)) ??
    workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  const { headerIdx, descCol, costCol, igvCol } = detectColumns(rows);

  let currentSection = 'General';
  const sectionsMap = new Map<string, ParsedBudgetLineItem[]>();

  const ensureSection = (name: string) => {
    if (!sectionsMap.has(name)) sectionsMap.set(name, []);
  };

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const desc = cellStr(row[descCol]);
    if (!desc || shouldSkipRow(desc)) continue;

    if (rowIsSectionHeader(row, descCol, costCol)) {
      currentSection = desc;
      ensureSection(currentSection);
      continue;
    }

    const cost = parseNumber(row[costCol]);
    if (cost === null) continue;

    ensureSection(currentSection);
    const igvValue = igvCol >= 0 ? parseNumber(row[igvCol]) : null;
    sectionsMap.get(currentSection)!.push({
      description: desc,
      budgetedCost: cost,
      hasIgv: (igvValue ?? 0) > 0,
    });
  }

  const sections = [...sectionsMap.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([name, lineItems], sortOrder) => ({ name, sortOrder, lineItems }));

  if (!sections.length) {
    throw new Error('No se encontraron secciones ni partidas válidas en el Excel');
  }

  return {
    sheetName,
    sections: sections.map(({ name, lineItems }) => ({ name, lineItems })),
  };
}
