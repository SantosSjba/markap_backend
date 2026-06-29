export const CONTABILIDAD_SALES_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export const CONTABILIDAD_SALES_CREDIT_NOTE_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;

export const CONTABILIDAD_SALES_DEBIT_NOTE_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;

export const CONTABILIDAD_SALES_TAX_AFFECTATION = {
  TAXABLE: 'TAXABLE',
  EXEMPT: 'EXEMPT',
  NON_TAXABLE: 'NON_TAXABLE',
} as const;

export const CONTABILIDAD_SALES_DOCUMENT_TYPE = {
  FACTURA: 'FACTURA',
  BOLETA: 'BOLETA',
  NOTA_CREDITO: 'NOTA_CREDITO',
  OTRO: 'OTRO',
} as const;

export const CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE = '1041';
export const CONTABILIDAD_SALES_IGV_ACCOUNT_CODE = '4011';
export const CONTABILIDAD_DEFAULT_INCOME_ACCOUNT_CODE = '701';

export const CONTABILIDAD_SALES_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Cobrada',
  CANCELLED: 'Anulada',
};

export const CONTABILIDAD_SALES_TAX_AFFECTATION_LABELS: Record<string, string> = {
  TAXABLE: 'Gravada',
  EXEMPT: 'Exonerada',
  NON_TAXABLE: 'Inafecta',
};

export const CONTABILIDAD_SALES_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta',
  NOTA_CREDITO: 'Nota de crédito',
  OTRO: 'Otro',
};
