export type RentalExpiringAlertType =
  | 'RENTAL_EXPIRING_30'
  | 'RENTAL_EXPIRING_60'
  | 'RENTAL_EXPIRING_90';

/** Días de anticipación de cada aviso: 3, 2 y 1 mes antes del vencimiento. */
const TIERS: readonly [number, RentalExpiringAlertType][] = [
  [30, 'RENTAL_EXPIRING_30'],
  [60, 'RENTAL_EXPIRING_60'],
  [90, 'RENTAL_EXPIRING_90'],
];

/**
 * Aviso que corresponde a los días que faltan: 61-90 → 3 meses, 31-60 → 2 meses,
 * 1-30 → 1 mes. Usa tramos (no el día exacto) para que un día sin ejecución no
 * pierda el aviso; cada aviso se envía una sola vez por vencimiento.
 */
export function rentalExpiringAlertType(
  daysLeft: number,
): RentalExpiringAlertType | null {
  if (daysLeft <= 0) return null;
  return TIERS.find(([limit]) => daysLeft <= limit)?.[1] ?? null;
}

/** Desde cuándo un aviso ya enviado cuenta para este vencimiento (renovar lo reinicia). */
export function rentalExpiringAlertWindowStart(endDate: Date): Date {
  const since = new Date(endDate);
  since.setUTCDate(since.getUTCDate() - 95);
  return since;
}
