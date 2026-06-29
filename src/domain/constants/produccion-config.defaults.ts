export const PRODUCCION_NUMBERING_SERIES_KEYS = {
  FURNITURE: 'FURNITURE',
  WORK_ORDER: 'WORK_ORDER',
  QUOTATION: 'QUOTATION',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  ORDER: 'ORDER',
  DELIVERY: 'DELIVERY',
} as const;

export type ProduccionNumberingSeriesKey =
  (typeof PRODUCCION_NUMBERING_SERIES_KEYS)[keyof typeof PRODUCCION_NUMBERING_SERIES_KEYS];

export const PRODUCCION_DEFAULT_PRODUCTION_STAGES = [
  { stageKey: 'planificacion', label: 'Planificación', sortOrder: 0 },
  { stageKey: 'corte', label: 'Corte', sortOrder: 1 },
  { stageKey: 'ensamble', label: 'Ensamble', sortOrder: 2 },
  { stageKey: 'acabados', label: 'Acabados', sortOrder: 3 },
] as const;

export const PRODUCCION_DEFAULT_STAGE_KEY_SET = new Set(
  PRODUCCION_DEFAULT_PRODUCTION_STAGES.map((s) => s.stageKey),
);

export const PRODUCCION_DEFAULT_FURNITURE_CATEGORIES = [
  { code: 'comedor', label: 'Comedor', sortOrder: 0 },
  { code: 'dormitorio', label: 'Dormitorio', sortOrder: 1 },
  { code: 'oficina', label: 'Oficina', sortOrder: 2 },
  { code: 'cocina', label: 'Cocina', sortOrder: 3 },
  { code: 'sala', label: 'Sala', sortOrder: 4 },
  { code: 'otro', label: 'Otro', sortOrder: 5 },
] as const;

export const PRODUCCION_DEFAULT_UNITS = [
  { code: 'und', label: 'Unidad (und)', sortOrder: 0 },
  { code: 'plancha', label: 'Plancha', sortOrder: 1 },
  { code: 'm', label: 'Metro (m)', sortOrder: 2 },
  { code: 'm2', label: 'Metro cuadrado (m²)', sortOrder: 3 },
  { code: 'kg', label: 'Kilogramo (kg)', sortOrder: 4 },
  { code: 'lt', label: 'Litro (lt)', sortOrder: 5 },
] as const;

export const PRODUCCION_DEFAULT_NUMBERING = [
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.FURNITURE, prefix: 'MUE', includeYear: false },
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.WORK_ORDER, prefix: 'OT', includeYear: true },
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.QUOTATION, prefix: 'COT', includeYear: true },
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.PURCHASE_ORDER, prefix: 'OC', includeYear: true },
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.ORDER, prefix: 'PED', includeYear: true },
  { seriesKey: PRODUCCION_NUMBERING_SERIES_KEYS.DELIVERY, prefix: 'ENT', includeYear: true },
] as const;
