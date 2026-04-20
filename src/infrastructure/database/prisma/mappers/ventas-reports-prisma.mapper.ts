import type { VentasReportsGranularity } from '@domain/entities/ventas-reports.entity';

export function periodLabel(d: Date, granularity: VentasReportsGranularity): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (granularity === 'month') return `${y}-${m}`;
  if (granularity === 'day') return `${y}-${m}-${day}`;
  const weekStart = new Date(d);
  const dow = weekStart.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const wy = weekStart.getFullYear();
  const wm = String(weekStart.getMonth() + 1).padStart(2, '0');
  const wd = String(weekStart.getDate()).padStart(2, '0');
  return `${wy}-${wm}-${wd}`;
}
