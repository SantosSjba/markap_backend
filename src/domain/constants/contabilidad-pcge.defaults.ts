export const CONTABILIDAD_ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  MEMO: 'MEMO',
} as const;

export type ContabilidadAccountType =
  (typeof CONTABILIDAD_ACCOUNT_TYPES)[keyof typeof CONTABILIDAD_ACCOUNT_TYPES];

export interface ContabilidadPcgeSeedRow {
  code: string;
  name: string;
  parentCode?: string;
  accountType: ContabilidadAccountType;
  isMovement: boolean;
  level: number;
  sortOrder: number;
}

/** Estructura PCGE base (Res. 194-2013-EF) — cuentas título y movimiento esenciales. */
export const CONTABILIDAD_PCGE_SEED: ContabilidadPcgeSeedRow[] = [
  // Clase 1 — Activo disponible y exigible
  { code: '10', name: 'ACTIVO', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 0 },
  { code: '101', name: 'Caja y bancos', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '10', sortOrder: 0 },
  { code: '1011', name: 'Caja', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '101', sortOrder: 0 },
  { code: '104', name: 'Cuentas corrientes', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '10', sortOrder: 1 },
  { code: '1041', name: 'Cuentas por cobrar comerciales - terceros', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '104', sortOrder: 0 },
  { code: '1042', name: 'Cuentas por cobrar comerciales - relacionadas', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '104', sortOrder: 1 },
  { code: '107', name: 'Activos financieros', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '10', sortOrder: 2 },
  { code: '1071', name: 'Depósitos en instituciones financieras', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '107', sortOrder: 0 },

  // Clase 2 — Activo realizable
  { code: '20', name: 'MERCADERÍAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 1 },
  { code: '201', name: 'Mercaderías manufacturadas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '20', sortOrder: 0 },
  { code: '202', name: 'Mercaderías en tránsito', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '20', sortOrder: 1 },

  // Clase 3 — Activo inmovilizado
  { code: '33', name: 'PROPIEDAD, PLANTA Y EQUIPO', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 2 },
  { code: '336', name: 'Maquinaria y equipo de explotación', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '33', sortOrder: 0 },
  { code: '3361', name: 'Maquinaria y equipo de explotación - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '336', sortOrder: 0 },
  { code: '337', name: 'Unidades de transporte', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '33', sortOrder: 1 },
  { code: '3371', name: 'Unidades de transporte - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '337', sortOrder: 0 },

  // Clase 4 — Pasivo
  { code: '40', name: 'TRIBUTOS, CONTRAPRESTACIONES Y APORTES AL SISTEMA', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 3 },
  { code: '401', name: 'Gobierno central', accountType: 'LIABILITY', isMovement: false, level: 2, parentCode: '40', sortOrder: 0 },
  { code: '4011', name: 'Impuesto General a las Ventas', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '401', sortOrder: 0 },
  { code: '4012', name: 'Renta', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '401', sortOrder: 1 },
  { code: '4017', name: 'Retenciones', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '401', sortOrder: 2 },
  { code: '4018', name: 'Detracciones', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '401', sortOrder: 3 },

  { code: '42', name: 'CUENTAS POR PAGAR COMERCIALES - TERCEROS', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 4 },
  { code: '421', name: 'Facturas, boletas y otros comprobantes por pagar', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '42', sortOrder: 0 },
  { code: '422', name: 'Anticipos a proveedores', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '42', sortOrder: 1 },

  // Clase 5 — Patrimonio
  { code: '50', name: 'CAPITAL', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 5 },
  { code: '501', name: 'Capital social', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '50', sortOrder: 0 },
  { code: '59', name: 'RESULTADOS NO DISTRIBUIDOS', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 6 },
  { code: '591', name: 'Utilidades no distribuidas', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '59', sortOrder: 0 },
  { code: '592', name: 'Pérdidas acumuladas', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '59', sortOrder: 1 },

  // Clase 6 — Gastos por naturaleza
  { code: '60', name: 'COMPRAS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 7 },
  { code: '601', name: 'Mercaderías', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '60', sortOrder: 0 },
  { code: '63', name: 'GASTOS DE SERVICIOS PRESTADOS POR TERCEROS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 8 },
  { code: '631', name: 'Transporte, correos y gastos de viaje', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 0 },
  { code: '636', name: 'Servicios básicos', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 1 },
  { code: '637', name: 'Servicios de asesoría', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 2 },
  { code: '69', name: 'COSTO DE VENTAS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 9 },
  { code: '691', name: 'Mercaderías manufacturadas', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '69', sortOrder: 0 },

  // Clase 7 — Ingresos
  { code: '70', name: 'VENTAS', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 10 },
  { code: '701', name: 'Mercaderías manufacturadas', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 0 },
  { code: '703', name: 'Servicios terminados', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 1 },
  { code: '75', name: 'OTROS INGRESOS DE GESTIÓN', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 11 },
  { code: '759', name: 'Otros ingresos de gestión', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '75', sortOrder: 0 },

  // Clase 9 — Cuentas de orden (referencia)
  { code: '90', name: 'CUENTAS DE ORDEN', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 12 },
  { code: '901', name: 'Mercaderías en consignación', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '90', sortOrder: 0 },
];

export const CONTABILIDAD_ACCOUNT_TYPE_LABELS: Record<ContabilidadAccountType, string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  MEMO: 'Orden',
};
