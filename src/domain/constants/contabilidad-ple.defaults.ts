export const CONTABILIDAD_PLE_APP_SLUG = 'contabilidad';

/** Códigos de libro electrónico SUNAT (estructura PLE). */
export const CONTABILIDAD_PLE_BOOK_CODE = {
  CAJA_BANCOS: '010100',
  LIBRO_DIARIO: '050100',
  PLAN_CUENTAS: '050200',
  LIBRO_MAYOR: '060100',
  REGISTRO_COMPRAS: '080100',
  REGISTRO_COMPRAS_NO_DOMIC: '080200',
  REGISTRO_VENTAS: '140100',
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
    code: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
    name: 'Registro de Ventas',
    description: 'Comprobantes de venta del periodo (14.1)',
    sunatStructure: '14.1',
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
