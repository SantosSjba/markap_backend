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

  // Cuentas adicionales PCGE (Fase 12)
  { code: '12', name: 'CUENTAS POR COBRAR DIVERSAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 13 },
  { code: '121', name: 'Cuentas por cobrar diversas - terceros', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '12', sortOrder: 0 },
  { code: '16', name: 'CUENTAS POR COBRAR DIVERSAS — OTROS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 14 },
  { code: '161', name: 'Cuentas por cobrar en venta con retención', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '16', sortOrder: 0 },
  { code: '167', name: 'Documentos por cobrar descontados', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '16', sortOrder: 1 },
  { code: '168', name: 'Intereses, comisiones y otros', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '16', sortOrder: 2 },
  { code: '2011', name: 'Mercaderías manufacturadas (detalle)', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '20', sortOrder: 2 },
  { code: '21', name: 'EXISTENCIAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 15 },
  { code: '211', name: 'Existencias en tránsito', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '21', sortOrder: 0 },
  { code: '212', name: 'Materias primas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '21', sortOrder: 1 },
  { code: '213', name: 'Suministros diversos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '21', sortOrder: 2 },
  { code: '31', name: 'TERRENOS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 16 },
  { code: '311', name: 'Terrenos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '31', sortOrder: 0 },
  { code: '32', name: 'EDIFICACIONES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 17 },
  { code: '321', name: 'Edificaciones', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '32', sortOrder: 0 },
  { code: '331', name: 'Maquinaria y equipo de explotación', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '33', sortOrder: 2 },
  { code: '341', name: 'Unidades de transporte', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '33', sortOrder: 3 },
  { code: '351', name: 'Muebles y enseres', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '33', sortOrder: 4 },
  { code: '403', name: 'Instituciones públicas', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '40', sortOrder: 1 },
  { code: '411', name: 'Gobierno central — detracciones', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '401', sortOrder: 3 },
  { code: '43', name: 'INSTITUCIONES DE SALUD', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 18 },
  { code: '431', name: 'ESSALUD', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '43', sortOrder: 0 },
  { code: '44', name: 'ONP', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 19 },
  { code: '441', name: 'ONP', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '44', sortOrder: 0 },
  { code: '45', name: 'REMUNERACIONES Y PARTICIPACIONES POR PAGAR', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 20 },
  { code: '451', name: 'Dirección Regional de Trabajo', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '45', sortOrder: 0 },
  { code: '46', name: 'FONDO DE PENSIONES', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 21 },
  { code: '461', name: 'Fondo de pensiones', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '46', sortOrder: 0 },
  { code: '47', name: 'CUENTAS POR PAGAR DIVERSAS', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 22 },
  { code: '471', name: 'Instituciones financieras', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '47', sortOrder: 0 },
  { code: '48', name: 'DIVIDENDOS POR PAGAR', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 23 },
  { code: '481', name: 'Dividendos por pagar', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '48', sortOrder: 0 },
  { code: '49', name: 'GANANCIALES POR PAGAR', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 24 },
  { code: '491', name: 'Gananciales por pagar', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '49', sortOrder: 0 },
  { code: '602', name: 'Materias primas', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '60', sortOrder: 1 },
  { code: '62', name: 'GASTOS DE PERSONAL', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 25 },
  { code: '621', name: 'Sueldos', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '62', sortOrder: 0 },
  { code: '622', name: 'Gratificaciones', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '62', sortOrder: 1 },
  { code: '6312', name: 'Alquileres', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 3 },
  { code: '64', name: 'GASTOS DE SEGUROS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 26 },
  { code: '641', name: 'Seguros', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '64', sortOrder: 0 },
  { code: '65', name: 'GASTOS DE SERVICIOS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 27 },
  { code: '651', name: 'Servicios básicos', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '65', sortOrder: 0 },
  { code: '66', name: 'GASTOS DE PROMOCIÓN', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 28 },
  { code: '661', name: 'Promoción', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '66', sortOrder: 0 },
  { code: '67', name: 'GASTOS FINANCIEROS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 29 },
  { code: '671', name: 'Gastos financieros', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '67', sortOrder: 0 },
  { code: '68', name: 'VALIDEZ DE ACTIVOS', accountType: 'EXPENSE', isMovement: false, level: 1, sortOrder: 30 },
  { code: '681', name: 'Validez de activos', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '68', sortOrder: 0 },
  { code: '702', name: 'Productos terminados', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 2 },
  { code: '76', name: 'GANANCIA POR VENTA DE ACTIVOS', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 31 },
  { code: '761', name: 'Ganancia por venta de activos', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '76', sortOrder: 0 },
  { code: '77', name: 'DESMANTELAMIENTO', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 32 },
  { code: '771', name: 'Desmantelamiento', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '77', sortOrder: 0 },
  { code: '79', name: 'CARGAS IMPUTABLES', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 33 },
  { code: '791', name: 'Cargas imputables a cuentas de costos', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '79', sortOrder: 0 },

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
