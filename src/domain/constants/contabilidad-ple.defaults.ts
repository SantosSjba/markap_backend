export const CONTABILIDAD_PLE_APP_SLUG = 'contabilidad';

/** Códigos de libro electrónico SUNAT (estructura PLE). */
export const CONTABILIDAD_PLE_BOOK_CODE = {
  CAJA_BANCOS: '010100',
  INVENTARIOS_BALANCES: '030100',
  LIBRO_DIARIO: '050100',
  PLAN_CUENTAS: '050200',
  LIBRO_DIARIO_SIMPLIFICADO: '050300',
  DETALLE_LIBRO_DIARIO: '050400',
  LIBRO_MAYOR: '060100',
  REGISTRO_COMPRAS: '080100',
  REGISTRO_COMPRAS_NO_DOMIC: '080200',
  REGISTRO_COMPRAS_COMPLEMENTARIO: '080300',
  REGISTRO_COMPRAS_NO_GRAVADAS: '080400',
  REGISTRO_VENTAS: '140100',
  REGISTRO_VENTAS_COMPLEMENTARIO: '140200',
} as const;

export type ContabilidadPleBookCode =
  (typeof CONTABILIDAD_PLE_BOOK_CODE)[keyof typeof CONTABILIDAD_PLE_BOOK_CODE];

export interface ContabilidadPleBookDefinition {
  code: ContabilidadPleBookCode;
  name: string;
  description: string;
  sunatStructure: string;
}

export const CONTABILIDAD_PLE_BOOKS: ContabilidadPleBookDefinition[] = [
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO,
    name: 'Libro Diario',
    description: 'Asientos publicados del periodo (5.1)',
    sunatStructure: '5.1',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO_SIMPLIFICADO,
    name: 'Libro Diario Simplificado',
    description: 'Resumen de asientos publicados (5.3 — RMT/MYPE)',
    sunatStructure: '5.3',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.DETALLE_LIBRO_DIARIO,
    name: 'Detalle del Libro Diario',
    description: 'Líneas de asiento con correlativo (5.4)',
    sunatStructure: '5.4',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS,
    name: 'Plan de Cuentas',
    description: 'Catálogo PCGE de cuentas de movimiento (5.2)',
    sunatStructure: '5.2',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.LIBRO_MAYOR,
    name: 'Libro Mayor',
    description: 'Movimientos por cuenta (6.1)',
    sunatStructure: '6.1',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
    name: 'Registro de Compras',
    description: 'Comprobantes de compra del periodo (8.1)',
    sunatStructure: '8.1',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_DOMIC,
    name: 'Registro de Compras — No domiciliados',
    description: 'Compras a proveedores no domiciliados (8.2)',
    sunatStructure: '8.2',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_COMPLEMENTARIO,
    name: 'Registro Compras — NC/ND',
    description: 'Notas de crédito y débito de compras (8.3 complementario)',
    sunatStructure: '8.3',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_GRAVADAS,
    name: 'Registro Compras — No gravadas',
    description: 'Compras exoneradas/inafectas del periodo (8.4)',
    sunatStructure: '8.4',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.INVENTARIOS_BALANCES,
    name: 'Libro de Inventarios y Balances',
    description: 'Saldos de cuentas al cierre del periodo (3.1)',
    sunatStructure: '3.1',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
    name: 'Registro de Ventas',
    description: 'Comprobantes de venta del periodo (14.1)',
    sunatStructure: '14.1',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS_COMPLEMENTARIO,
    name: 'Registro Ventas — NC/ND',
    description: 'Notas de crédito y débito de ventas (14.2 complementario)',
    sunatStructure: '14.2',
  },
  {
    code: CONTABILIDAD_PLE_BOOK_CODE.CAJA_BANCOS,
    name: 'Libro Caja y Bancos',
    description: 'Movimientos de tesorería (1.1)',
    sunatStructure: '1.1',
  },
];

export const CONTABILIDAD_PLE_BOOK_CODE_SET = new Set<string>(
  CONTABILIDAD_PLE_BOOKS.map((b) => b.code),
);

export function isValidPleBookCode(code: string): code is ContabilidadPleBookCode {
  return CONTABILIDAD_PLE_BOOK_CODE_SET.has(code);
}

/** Libros obligatorios de referencia según régimen tributario configurado. */
export const CONTABILIDAD_PLE_MANDATORY_BY_TAX_REGIME: Record<string, string[]> = {
  GENERAL: [
    CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO,
    CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS,
    CONTABILIDAD_PLE_BOOK_CODE.LIBRO_MAYOR,
    CONTABILIDAD_PLE_BOOK_CODE.INVENTARIOS_BALANCES,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
    CONTABILIDAD_PLE_BOOK_CODE.CAJA_BANCOS,
  ],
  RMT: [
    CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO_SIMPLIFICADO,
    CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
  ],
  MYPE: [
    CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO_SIMPLIFICADO,
    CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
  ],
  NRUS: [
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
    CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
  ],
};

export const CONTABILIDAD_SUNAT_DOC_TYPE = {
  FACTURA: '01',
  CREDIT_NOTE: '07',
  DEBIT_NOTE: '08',
} as const;
