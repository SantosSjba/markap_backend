import {
  CONTABILIDAD_PCGE_SEED,
  type ContabilidadAccountType,
  type ContabilidadPcgeSeedRow,
} from './contabilidad-pcge.defaults';

export const CONTABILIDAD_PCGE_CLASS_LABELS: Record<number, string> = {
  1: 'Disponible y exigible (10–19)',
  2: 'Activo realizable (20–29)',
  3: 'Activo inmovilizado (30–39)',
  4: 'Pasivo (40–49)',
  5: 'Patrimonio neto (50–59)',
  6: 'Gastos por naturaleza (60–69)',
  7: 'Ingresos (70–79)',
  8: 'Saldos intermediarios (80–89)',
  9: 'Analíticas / orden (90–99)',
};

/** Primer dígito del código PCGE = clase (elemento). */
export function pcgeAccountClass(code: string): number {
  const digit = parseInt(code.charAt(0), 10);
  return Number.isFinite(digit) ? digit : 0;
}

type Row = Omit<ContabilidadPcgeSeedRow, 'accountType'> & { accountType: ContabilidadAccountType };

/** Cuentas adicionales al seed esencial — estructura PCGE 2019 por rubros principales. */
const CONTABILIDAD_PCGE_EXTENDED: Row[] = [
  // Clase 1
  { code: '11', name: 'INVERSIONES MOBILIARIAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 1 },
  { code: '111', name: 'Inversiones mobiliarias', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '11', sortOrder: 0 },
  { code: '13', name: 'CUENTAS POR COBRAR COMERCIALES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 2 },
  { code: '131', name: 'Cuentas por cobrar comerciales - terceros', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '13', sortOrder: 0 },
  { code: '132', name: 'Cuentas por cobrar comerciales - relacionadas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '13', sortOrder: 1 },
  { code: '14', name: 'CUENTAS POR COBRAR AL PERSONAL', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 3 },
  { code: '141', name: 'Préstamos al personal', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '14', sortOrder: 0 },
  { code: '142', name: 'Adelanto de remuneraciones', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '14', sortOrder: 1 },
  { code: '15', name: 'CUENTAS POR COBRAR A ACCIONISTAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 4 },
  { code: '151', name: 'Cuentas por cobrar a accionistas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '15', sortOrder: 0 },
  { code: '16', name: 'CUENTAS POR COBRAR DIVERSAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 5 },
  { code: '162', name: 'Cuentas por cobrar diversas - relacionadas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '16', sortOrder: 1 },
  { code: '163', name: 'Intereses, comisiones y otros', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '16', sortOrder: 2 },
  { code: '17', name: 'DOCUMENTOS POR COBRAR', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 6 },
  { code: '171', name: 'Documentos por cobrar', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '17', sortOrder: 0 },
  { code: '18', name: 'SERVICIOS Y OTROS CONTRATADOS POR ANTICIPADO', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 7 },
  { code: '181', name: 'Seguros', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '18', sortOrder: 0 },
  { code: '182', name: 'Alquileres pagados por anticipado', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '18', sortOrder: 1 },
  { code: '19', name: 'ESTIMACIÓN DE CUENTAS DE COBRANZA DUDOSA', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 8 },
  { code: '191', name: 'Estimación de cuentas de cobranza dudosa', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '19', sortOrder: 0 },
  { code: '102', name: 'Fondos fijos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '101', sortOrder: 1 },
  { code: '103', name: 'Efectivo y equivalentes restringidos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '101', sortOrder: 2 },
  { code: '106', name: 'Depósitos en instituciones financieras', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '10', sortOrder: 3 },
  { code: '1061', name: 'Depósitos en instituciones financieras', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '106', sortOrder: 0 },

  // Clase 2
  { code: '22', name: 'PRODUCTOS TERMINADOS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 2 },
  { code: '221', name: 'Productos terminados', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '22', sortOrder: 0 },
  { code: '23', name: 'PRODUCTOS EN PROCESO', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 3 },
  { code: '231', name: 'Productos en proceso', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '23', sortOrder: 0 },
  { code: '24', name: 'MATERIAS PRIMAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 4 },
  { code: '241', name: 'Materias primas', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '24', sortOrder: 0 },
  { code: '25', name: 'MATERIALES AUXILIARES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 5 },
  { code: '251', name: 'Materiales auxiliares', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '25', sortOrder: 0 },
  { code: '26', name: 'ENVASES Y EMBALAJES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 6 },
  { code: '261', name: 'Envases y embalajes', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '26', sortOrder: 0 },
  { code: '27', name: 'ACTIVOS BIOLÓGICOS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 7 },
  { code: '271', name: 'Activos biológicos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '27', sortOrder: 0 },
  { code: '28', name: 'EXISTENCIAS A RECIBIR', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 8 },
  { code: '281', name: 'Existencias a recibir', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '28', sortOrder: 0 },
  { code: '29', name: 'DESVALORIZACIÓN DE EXISTENCIAS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 9 },
  { code: '291', name: 'Desvalorización de existencias', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '29', sortOrder: 0 },

  // Clase 3
  { code: '34', name: 'MUEBLES Y ENSERES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 3 },
  { code: '341', name: 'Muebles y enseres', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '34', sortOrder: 0 },
  { code: '3411', name: 'Muebles y enseres - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '341', sortOrder: 0 },
  { code: '35', name: 'EQUIPO DE PROCESAMIENTO DE INFORMACIÓN', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 4 },
  { code: '351', name: 'Equipo de procesamiento de información', accountType: 'ASSET', isMovement: false, level: 2, parentCode: '35', sortOrder: 0 },
  { code: '3511', name: 'Equipo de procesamiento - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '351', sortOrder: 0 },
  { code: '36', name: 'ACTIVOS BIOLÓGICOS', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 5 },
  { code: '361', name: 'Activos biológicos', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '36', sortOrder: 0 },
  { code: '37', name: 'ACTIVOS DADOS EN ARRENDAMIENTO FINANCIERO', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 6 },
  { code: '371', name: 'Activos en arrendamiento financiero', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '37', sortOrder: 0 },
  { code: '38', name: 'INTANGIBLES', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 7 },
  { code: '381', name: 'Intangibles', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '38', sortOrder: 0 },
  { code: '39', name: 'DEPRECIACIÓN Y AMORTIZACIÓN ACUMULADA', accountType: 'ASSET', isMovement: false, level: 1, sortOrder: 8 },
  { code: '391', name: 'Depreciación acumulada', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '39', sortOrder: 0 },
  { code: '392', name: 'Amortización acumulada', accountType: 'ASSET', isMovement: true, level: 2, parentCode: '39', sortOrder: 1 },
  { code: '3211', name: 'Edificaciones - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '32', sortOrder: 0 },
  { code: '3111', name: 'Terrenos - costo', accountType: 'ASSET', isMovement: true, level: 3, parentCode: '31', sortOrder: 0 },

  // Clase 4
  { code: '41', name: 'REMUNERACIONES Y PARTICIPACIONES POR PAGAR', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 1 },
  { code: '4111', name: 'Remuneraciones por pagar', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '41', sortOrder: 0 },
  { code: '4112', name: 'Participaciones por pagar', accountType: 'LIABILITY', isMovement: true, level: 3, parentCode: '41', sortOrder: 1 },
  { code: '423', name: 'Letras por pagar', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '42', sortOrder: 2 },
  { code: '424', name: 'Cuentas por pagar comerciales - relacionadas', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '42', sortOrder: 3 },
  { code: '46', name: 'CUENTAS POR PAGAR DIVERSAS - TERCEROS', accountType: 'LIABILITY', isMovement: false, level: 1, sortOrder: 3 },
  { code: '469', name: 'Otras cuentas por pagar diversas', accountType: 'LIABILITY', isMovement: true, level: 2, parentCode: '46', sortOrder: 1 },

  // Clase 5
  { code: '51', name: 'ACCIONES DE INVERSIÓN', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 1 },
  { code: '511', name: 'Acciones de inversión', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '51', sortOrder: 0 },
  { code: '52', name: 'CAPITAL ADICIONAL', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 2 },
  { code: '521', name: 'Capital adicional', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '52', sortOrder: 0 },
  { code: '56', name: 'RESULTADOS NO REALIZADOS', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 3 },
  { code: '561', name: 'Resultados no realizados', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '56', sortOrder: 0 },
  { code: '58', name: 'RESERVAS', accountType: 'EQUITY', isMovement: false, level: 1, sortOrder: 4 },
  { code: '581', name: 'Reservas legales', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '58', sortOrder: 0 },
  { code: '582', name: 'Reservas facultativas', accountType: 'EQUITY', isMovement: true, level: 2, parentCode: '58', sortOrder: 1 },

  // Clase 6
  { code: '603', name: 'Suministros diversos', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '60', sortOrder: 2 },
  { code: '604', name: 'Envases y embalajes', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '60', sortOrder: 3 },
  { code: '605', name: 'Otros', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '60', sortOrder: 4 },
  { code: '623', name: 'Participaciones a los trabajadores', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '62', sortOrder: 2 },
  { code: '624', name: 'Capacitación', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '62', sortOrder: 3 },
  { code: '625', name: 'Atenciones al personal', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '62', sortOrder: 4 },
  { code: '632', name: 'Asesorías', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 4 },
  { code: '633', name: 'Servicios prestados por terceros', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 5 },
  { code: '634', name: 'Mantenimiento y reparaciones', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 6 },
  { code: '635', name: 'Publicidad', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '63', sortOrder: 7 },
  { code: '692', name: 'Productos terminados', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '69', sortOrder: 1 },
  { code: '693', name: 'Servicios terminados', accountType: 'EXPENSE', isMovement: true, level: 2, parentCode: '69', sortOrder: 2 },

  // Clase 7
  { code: '704', name: 'Subproductos', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 3 },
  { code: '705', name: 'Desechos y desmedros', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 4 },
  { code: '706', name: 'Servicios terminados', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '70', sortOrder: 5 },
  { code: '71', name: 'VARIACIÓN DE EXISTENCIAS', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 2 },
  { code: '711', name: 'Variación de existencias', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '71', sortOrder: 0 },
  { code: '72', name: 'PRODUCCIÓN DE ACTIVO INMOVILIZADO', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 3 },
  { code: '721', name: 'Producción de activo inmovilizado', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '72', sortOrder: 0 },
  { code: '73', name: 'DESCUENTOS, REBAJAS Y BONIFICACIONES', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 4 },
  { code: '731', name: 'Descuentos, rebajas y bonificaciones obtenidos', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '73', sortOrder: 0 },
  { code: '74', name: 'DESCUENTOS, REBAJAS Y BONIFICACIONES CONCEDIDOS', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 5 },
  { code: '741', name: 'Descuentos, rebajas y bonificaciones concedidos', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '74', sortOrder: 0 },
  { code: '78', name: 'CARGAS FINANCIERAS IMPUTABLES', accountType: 'INCOME', isMovement: false, level: 1, sortOrder: 6 },
  { code: '781', name: 'Cargas financieras imputables', accountType: 'INCOME', isMovement: true, level: 2, parentCode: '78', sortOrder: 0 },

  // Clase 8
  { code: '80', name: 'SALDOS INTERMEDIARIOS DE GESTIÓN', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 0 },
  { code: '801', name: 'Margen bruto', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '80', sortOrder: 0 },
  { code: '81', name: 'PRODUCCIÓN DEL EJERCICIO', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 1 },
  { code: '811', name: 'Producción del ejercicio', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '81', sortOrder: 0 },
  { code: '89', name: 'DETERMINACIÓN DEL RESULTADO', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 2 },
  { code: '891', name: 'Utilidad del ejercicio', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '89', sortOrder: 0 },
  { code: '892', name: 'Pérdida del ejercicio', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '89', sortOrder: 1 },

  // Clase 9
  { code: '91', name: 'COSTOS DE PRODUCCIÓN', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 1 },
  { code: '911', name: 'Costos de producción', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '91', sortOrder: 0 },
  { code: '92', name: 'GASTOS DE ADMINISTRACIÓN', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 2 },
  { code: '921', name: 'Gastos de administración', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '92', sortOrder: 0 },
  { code: '93', name: 'GASTOS DE VENTAS', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 3 },
  { code: '931', name: 'Gastos de ventas', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '93', sortOrder: 0 },
  { code: '94', name: 'GASTOS DE FINANCIAMIENTO', accountType: 'MEMO', isMovement: false, level: 1, sortOrder: 4 },
  { code: '941', name: 'Gastos de financiamiento', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '94', sortOrder: 0 },
  { code: '902', name: 'Mercaderías recibidas en consignación', accountType: 'MEMO', isMovement: true, level: 2, parentCode: '90', sortOrder: 1 },
];

function dedupeByCode(rows: ContabilidadPcgeSeedRow[]): ContabilidadPcgeSeedRow[] {
  const map = new Map<string, ContabilidadPcgeSeedRow>();
  for (const row of rows) {
    map.set(row.code, row);
  }
  return [...map.values()];
}

/** Catálogo PCGE completo (seed esencial + extensión). */
export const CONTABILIDAD_PCGE_FULL_CATALOG: ContabilidadPcgeSeedRow[] = dedupeByCode([
  ...CONTABILIDAD_PCGE_SEED,
  ...CONTABILIDAD_PCGE_EXTENDED,
]);

export function filterPcgeCatalogByClasses(classes: number[]): ContabilidadPcgeSeedRow[] {
  const allowed = new Set(classes.filter((c) => c >= 1 && c <= 9));
  if (!allowed.size) return [];
  return CONTABILIDAD_PCGE_FULL_CATALOG.filter((row) => allowed.has(pcgeAccountClass(row.code)));
}

export function listPcgeCatalogClassesMeta(): Array<{ class: number; label: string; accountCount: number }> {
  return Object.entries(CONTABILIDAD_PCGE_CLASS_LABELS).map(([cls, label]) => {
    const classNum = Number(cls);
    return {
      class: classNum,
      label,
      accountCount: filterPcgeCatalogByClasses([classNum]).length,
    };
  });
}
