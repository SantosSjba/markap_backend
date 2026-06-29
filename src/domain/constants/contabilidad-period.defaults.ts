export const CONTABILIDAD_PERIOD_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type ContabilidadPeriodStatus =
  (typeof CONTABILIDAD_PERIOD_STATUS)[keyof typeof CONTABILIDAD_PERIOD_STATUS];

export const CONTABILIDAD_MONTH_LABELS: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

export const CONTABILIDAD_DEFAULT_COST_CENTERS = [
  { code: 'ADM', name: 'Administración' },
  { code: 'VTA', name: 'Ventas' },
  { code: 'PRD', name: 'Producción' },
] as const;
