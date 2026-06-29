export const CONTABILIDAD_DOCUMENT_SERIES_KEYS = {
  SALES_INVOICE: 'SALES_INVOICE',
  SALES_RECEIPT: 'SALES_RECEIPT',
  SALES_CREDIT_NOTE: 'SALES_CREDIT_NOTE',
  SALES_DEBIT_NOTE: 'SALES_DEBIT_NOTE',
  PURCHASE_DEBIT_NOTE: 'PURCHASE_DEBIT_NOTE',
} as const;

export type ContabilidadDocumentSeriesKey =
  (typeof CONTABILIDAD_DOCUMENT_SERIES_KEYS)[keyof typeof CONTABILIDAD_DOCUMENT_SERIES_KEYS];

export const CONTABILIDAD_TAX_REGIMES = [
  { code: 'GENERAL', label: 'Régimen general' },
  { code: 'RMT', label: 'Régimen MYPE tributario' },
  { code: 'MYPE', label: 'Régimen MYPE' },
  { code: 'NRUS', label: 'Nuevo RUS' },
] as const;

export const CONTABILIDAD_DEFAULT_COMPANY = {
  ruc: '20601234565',
  legalName: 'MARKAP DEMO S.A.C.',
  tradeName: 'MARKAP',
  fiscalAddress: 'Av. Ejemplo 123, Urb. Demo',
  district: 'Miraflores',
  province: 'Lima',
  department: 'Lima',
  ubigeoCode: '150122',
} as const;

export const CONTABILIDAD_DEFAULT_DOCUMENT_SERIES = [
  { seriesKey: CONTABILIDAD_DOCUMENT_SERIES_KEYS.SALES_INVOICE, sunatSeries: 'F001' },
  { seriesKey: CONTABILIDAD_DOCUMENT_SERIES_KEYS.SALES_RECEIPT, sunatSeries: 'B001' },
  { seriesKey: CONTABILIDAD_DOCUMENT_SERIES_KEYS.SALES_CREDIT_NOTE, sunatSeries: 'FC01' },
  { seriesKey: CONTABILIDAD_DOCUMENT_SERIES_KEYS.SALES_DEBIT_NOTE, sunatSeries: 'FD01' },
  { seriesKey: CONTABILIDAD_DOCUMENT_SERIES_KEYS.PURCHASE_DEBIT_NOTE, sunatSeries: 'FD02' },
] as const;
