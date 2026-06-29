export const CONTABILIDAD_TREASURY_SOURCE_TYPE = {
  CASH: 'CASH',
  BANK: 'BANK',
} as const;

export const CONTABILIDAD_TREASURY_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
} as const;

export const CONTABILIDAD_TREASURY_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Ingreso',
  OUT: 'Egreso',
  TRANSFER_OUT: 'Transferencia (salida)',
  TRANSFER_IN: 'Transferencia (ingreso)',
};

export const CONTABILIDAD_RECONCILIATION_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export const CONTABILIDAD_RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
};

export const CONTABILIDAD_TREASURY_DEFAULTS = {
  CASH_CODE: 'CAJA-01',
  CASH_NAME: 'Caja principal',
  CASH_ACCOUNT_CODE: '1011',
  BANK_CODE: 'BCP-01',
  BANK_NAME: 'Banco BCP — Cuenta soles',
  BANK_INSTITUTION: 'BCP',
  BANK_ACCOUNT_NUMBER: '000-0000000-0-00',
  BANK_ACCOUNT_CODE: '1071',
} as const;
