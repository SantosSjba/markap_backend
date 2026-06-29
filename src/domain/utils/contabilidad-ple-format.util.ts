export function pleSanitize(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\|/g, ' ').replace(/\r?\n/g, ' ').trim();
}

export function pleFormatDate(isoDate: string): string {
  const d = isoDate.slice(0, 10);
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export function pleFormatAmount(value: string | number | { toString(): string }): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}

export function pleJoin(fields: (string | number | null | undefined)[]): string {
  return fields.map((f) => pleSanitize(f)).join('|');
}

/** Nombre de archivo PLE simplificado: LE{ruc}{yyyy}{mm}00{bookCode}00.txt */
export function pleFileName(ruc: string, year: number, month: number, bookCode: string): string {
  const mm = String(month).padStart(2, '0');
  return `LE${ruc}${year}${mm}00${bookCode}00.txt`;
}

export function pleHeaderLine(
  ruc: string,
  legalName: string,
  year: number,
  month: number,
  bookCode: string,
  lineCount: number,
): string {
  return pleJoin([
    'H',
    ruc,
    pleSanitize(legalName),
    year,
    String(month).padStart(2, '0'),
    bookCode,
    lineCount,
    'PEN',
    '1',
  ]);
}
