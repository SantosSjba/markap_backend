export const CONTABILIDAD_INVENTORY_APP_SLUG = 'contabilidad';

export const CONTABILIDAD_INVENTORY_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
} as const;

export const CONTABILIDAD_INVENTORY_COST_METHOD = {
  PROMEDIO: 'PROMEDIO',
  PEPS: 'PEPS',
} as const;

export const CONTABILIDAD_INVENTORY_OFFSET_TYPE = {
  PAYABLE: 'PAYABLE',
  EXPENSE: 'EXPENSE',
} as const;

export const CONTABILIDAD_INVENTORY_EXPENSE_ACCOUNT_CODE = '601';
export const CONTABILIDAD_INVENTORY_COGS_ACCOUNT_CODE = '691';

export const CONTABILIDAD_INVENTORY_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUST: 'Ajuste',
};

export const CONTABILIDAD_INVENTORY_COST_METHOD_LABELS: Record<string, string> = {
  PROMEDIO: 'Promedio ponderado',
  PEPS: 'PEPS (FIFO)',
};

export const CONTABILIDAD_INVENTORY_OFFSET_TYPE_LABELS: Record<string, string> = {
  PAYABLE: 'Cuentas por pagar (421)',
  EXPENSE: 'Gasto / compra (601)',
};
