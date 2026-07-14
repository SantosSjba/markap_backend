/**
 * Peru (America/Lima) calendar-date helpers.
 *
 * Convention for DATE-ONLY fields (startDate, endDate, dueDate, paidDate, …):
 * - Persist as UTC noon of that civil day → stable `YYYY-MM-DD` via UTC getters /
 *   `toISOString().slice(0, 10)` and no off-by-one in America/Lima.
 * - Never use bare `new Date('YYYY-MM-DD')` (that is UTC midnight).
 *
 * Real timestamps (createdAt, postedAt, …) stay as instants; format them with
 * `timeZone: America/Lima` at the edges that need human display.
 */

export const PERU_TIME_ZONE = 'America/Lima';
export const PERU_LOCALE = 'es-PE';

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's civil date in America/Lima as `YYYY-MM-DD`. */
export function todayDateOnlyLima(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Parse a date-only input (`YYYY-MM-DD` or ISO starting with that) into a Date
 * stored at UTC noon of that civil day.
 */
export function parseDateOnly(input: string | Date): Date {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return parseDateOnly(formatDateOnly(input));
  }
  const m = String(input).trim().match(YMD_RE);
  if (!m) {
    throw new Error(`Invalid date-only value: ${String(input)}`);
  }
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
}

/**
 * Format a stored Date / ISO string as civil `YYYY-MM-DD`.
 * Uses UTC Y-M-D so values persisted via {@link parseDateOnly} (or legacy midnight UTC)
 * round-trip without Lima off-by-one.
 */
export function formatDateOnly(value: Date | string): string {
  if (typeof value === 'string') {
    const m = value.trim().match(YMD_RE);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    value = new Date(value);
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }
  return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
}

/** Alias used across contabilidad/arquitectura mappers. */
export const toIsoDate = formatDateOnly;

/**
 * Parse optional date-only string; returns null for empty/undefined.
 */
export function parseDateOnlyOrNull(
  input: string | Date | null | undefined,
): Date | null {
  if (input == null || input === '') return null;
  return parseDateOnly(input);
}

/** Calendar year in the date-only convention (for codes like ALQ-2026-…). */
export function dateOnlyYear(value: Date | string): number {
  return Number(formatDateOnly(value).slice(0, 4));
}

/** UTC-noon Date for "today" in America/Lima (for Prisma date-only comparisons). */
export function startOfTodayLima(now: Date = new Date()): Date {
  return parseDateOnly(todayDateOnlyLima(now));
}

/** Normalize any date-only value to UTC-noon of its civil day. */
export function startOfDayLima(value: Date | string): Date {
  return parseDateOnly(formatDateOnly(value));
}

/** Inclusive day difference (Lima calendar) between two date-only values. */
export function diffCalendarDays(from: Date | string, to: Date | string): number {
  const a = startOfDayLima(from).getTime();
  const b = startOfDayLima(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Start of a Lima civil day as a real UTC instant (for filtering timestamps).
 * America/Lima is UTC−5 year-round (no DST).
 */
export function startOfLimaDayInstant(ymd: string | Date): Date {
  const s = typeof ymd === 'string' ? formatDateOnly(ymd) : formatDateOnly(ymd);
  const m = s.match(YMD_RE)!;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 5, 0, 0, 0));
}

/** End of a Lima civil day as a real UTC instant (inclusive). */
export function endOfLimaDayInstant(ymd: string | Date): Date {
  const s = typeof ymd === 'string' ? formatDateOnly(ymd) : formatDateOnly(ymd);
  const m = s.match(YMD_RE)!;
  return new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1, 4, 59, 59, 999),
  );
}
