import {
  dateOnlyYear,
  diffCalendarDays,
  formatDateOnly,
  parseDateOnly,
  startOfDayLima,
  todayDateOnlyLima,
} from './peru-date.util';

describe('peru-date.util', () => {
  it('parses YYYY-MM-DD as UTC noon (not midnight)', () => {
    const d = parseDateOnly('2026-06-14');
    expect(d.toISOString()).toBe('2026-06-14T12:00:00.000Z');
    expect(formatDateOnly(d)).toBe('2026-06-14');
  });

  it('round-trips legacy midnight UTC without Lima off-by-one', () => {
    const legacy = new Date('2026-06-14T00:00:00.000Z');
    expect(formatDateOnly(legacy)).toBe('2026-06-14');
    expect(formatDateOnly(legacy.toISOString())).toBe('2026-06-14');
  });

  it('extracts year for contract codes from date-only values', () => {
    expect(dateOnlyYear('2026-01-01')).toBe(2026);
    expect(dateOnlyYear(new Date('2026-01-01T00:00:00.000Z'))).toBe(2026);
  });

  it('diffCalendarDays is inclusive of civil days', () => {
    expect(diffCalendarDays('2026-06-14', '2027-06-13')).toBe(364);
    expect(diffCalendarDays(startOfDayLima('2026-06-14'), '2026-06-14')).toBe(0);
  });

  it('todayDateOnlyLima returns YYYY-MM-DD', () => {
    expect(todayDateOnlyLima(new Date('2026-07-14T05:00:00.000Z'))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});
