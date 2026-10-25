export const CONTABILIDAD_AUDIT_ENTITY_TYPE = {
  JOURNAL_ENTRY: 'JOURNAL_ENTRY',
  PERIOD: 'PERIOD',
  ACCOUNT: 'ACCOUNT',
  LEGAL_ENTITY: 'LEGAL_ENTITY',
} as const;

export const CONTABILIDAD_AUDIT_ACTION = {
  JOURNAL_POST: 'JOURNAL_POST',
  JOURNAL_REVERSE: 'JOURNAL_REVERSE',
  PERIOD_CLOSE: 'PERIOD_CLOSE',
  PERIOD_OPEN: 'PERIOD_OPEN',
  ACCOUNT_CREATE: 'ACCOUNT_CREATE',
  ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
  ACCOUNT_DEACTIVATE: 'ACCOUNT_DEACTIVATE',
} as const;

export const CONTABILIDAD_AUDIT_ACTION_LABELS: Record<string, string> = {
  JOURNAL_POST: 'Publicación de asiento',
  JOURNAL_REVERSE: 'Reversa de asiento',
  PERIOD_CLOSE: 'Cierre de periodo',
  PERIOD_OPEN: 'Apertura de periodo',
  ACCOUNT_CREATE: 'Alta de cuenta',
  ACCOUNT_UPDATE: 'Actualización de cuenta',
  ACCOUNT_DEACTIVATE: 'Desactivación de cuenta',
};

export const CONTABILIDAD_AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  JOURNAL_ENTRY: 'Asiento contable',
  PERIOD: 'Periodo contable',
  ACCOUNT: 'Cuenta PCGE',
  LEGAL_ENTITY: 'Entidad legal',
};
