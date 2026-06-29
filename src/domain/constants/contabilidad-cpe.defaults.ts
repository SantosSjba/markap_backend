export const CONTABILIDAD_CPE_PROVIDER = {
  MOCK: 'MOCK',
  NUBEFACT: 'NUBEFACT',
  BIZLINKS: 'BIZLINKS',
  SUNAT: 'SUNAT',
} as const;

export const CONTABILIDAD_CPE_ELECTRONIC_STATUS = {
  NONE: 'NONE',
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export const CONTABILIDAD_CPE_SOURCE_TYPE = {
  SALES_INVOICE: 'SALES_INVOICE',
  SALES_CREDIT_NOTE: 'SALES_CREDIT_NOTE',
  SALES_DEBIT_NOTE: 'SALES_DEBIT_NOTE',
} as const;

export const CONTABILIDAD_CPE_DOCUMENT_KIND = {
  FACTURA: 'FACTURA',
  BOLETA: 'BOLETA',
  NOTA_CREDITO: 'NOTA_CREDITO',
  NOTA_DEBITO: 'NOTA_DEBITO',
} as const;

export const CONTABILIDAD_CPE_PROVIDER_LABELS: Record<string, string> = {
  MOCK: 'Simulador (sandbox)',
  NUBEFACT: 'Nubefact',
  BIZLINKS: 'Bizlinks',
  SUNAT: 'SUNAT directo',
};

export const CONTABILIDAD_CPE_STATUS_LABELS: Record<string, string> = {
  NONE: 'Sin emitir',
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ACCEPTED: 'Aceptado SUNAT',
  REJECTED: 'Rechazado',
  REGISTERED: 'Registrado local',
};

export const CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_CODE = '0';
export const CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_MESSAGE = 'La Factura ha sido aceptada (simulador MARKAP)';
