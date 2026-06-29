export const CONTABILIDAD_APPLICATION_SLUG = 'contabilidad';

/**
 * Estructura ERP contable:
 * Contabilidad → Tesorería → Compras/Ventas → Tributos → Libros electrónicos → Reportes
 */
export const CONTABILIDAD_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/contabilidad', order: 0 },
  { label: 'Contabilidad', icon: 'book-open', path: null, order: 1 },
  { label: 'Tesorería', icon: 'landmark', path: null, order: 2 },
  { label: 'Compras', icon: 'shopping-cart', path: null, order: 3 },
  { label: 'Ventas', icon: 'receipt', path: null, order: 4 },
  { label: 'Tributos', icon: 'percent', path: null, order: 5 },
  { label: 'Libros electrónicos', icon: 'library', path: null, order: 6 },
  { label: 'Reportes financieros', icon: 'pie-chart', path: null, order: 7 },
  { label: 'Configuración', icon: 'settings', path: '/contabilidad/configuracion', order: 8 },
];

export const CONTABILIDAD_CHILD_MENUS = [
  // Contabilidad
  {
    label: 'Plan de cuentas',
    path: '/contabilidad/plan-cuentas',
    order: 0,
    parentLabel: 'Contabilidad',
  },
  {
    label: 'Asientos contables',
    path: '/contabilidad/asientos/libro-diario',
    order: 1,
    parentLabel: 'Contabilidad',
  },
  {
    label: 'Periodos contables',
    path: '/contabilidad/periodos',
    order: 2,
    parentLabel: 'Contabilidad',
  },
  {
    label: 'Centros de costo',
    path: '/contabilidad/centros-costo',
    order: 3,
    parentLabel: 'Contabilidad',
  },
  {
    label: 'Cierre mensual',
    path: '/contabilidad/cierre-mensual',
    order: 4,
    parentLabel: 'Contabilidad',
  },
  // Tesorería
  {
    label: 'Caja',
    path: '/contabilidad/tesoreria/caja',
    order: 0,
    parentLabel: 'Tesorería',
  },
  {
    label: 'Bancos',
    path: '/contabilidad/tesoreria/bancos',
    order: 1,
    parentLabel: 'Tesorería',
  },
  {
    label: 'Conciliaciones',
    path: '/contabilidad/tesoreria/conciliaciones',
    order: 2,
    parentLabel: 'Tesorería',
  },
  {
    label: 'Movimientos',
    path: '/contabilidad/tesoreria/movimientos',
    order: 3,
    parentLabel: 'Tesorería',
  },
  {
    label: 'Transferencias',
    path: '/contabilidad/tesoreria/transferencias',
    order: 4,
    parentLabel: 'Tesorería',
  },
  // Compras
  {
    label: 'Facturas de compra',
    path: '/contabilidad/compras/facturas',
    order: 0,
    parentLabel: 'Compras',
  },
  {
    label: 'Notas de crédito',
    path: '/contabilidad/compras/notas-credito',
    order: 1,
    parentLabel: 'Compras',
  },
  {
    label: 'Proveedores',
    path: '/contabilidad/compras/proveedores',
    order: 2,
    parentLabel: 'Compras',
  },
  {
    label: 'Pagos',
    path: '/contabilidad/compras/pagos',
    order: 3,
    parentLabel: 'Compras',
  },
  // Ventas
  {
    label: 'Facturas',
    path: '/contabilidad/ventas/facturas',
    order: 0,
    parentLabel: 'Ventas',
  },
  {
    label: 'Boletas',
    path: '/contabilidad/ventas/boletas',
    order: 1,
    parentLabel: 'Ventas',
  },
  {
    label: 'Notas de crédito',
    path: '/contabilidad/ventas/notas-credito',
    order: 2,
    parentLabel: 'Ventas',
  },
  {
    label: 'Clientes',
    path: '/contabilidad/ventas/clientes',
    order: 3,
    parentLabel: 'Ventas',
  },
  {
    label: 'Cobros',
    path: '/contabilidad/ventas/cobros',
    order: 4,
    parentLabel: 'Ventas',
  },
  // Tributos
  {
    label: 'IGV',
    path: '/contabilidad/tributos/igv',
    order: 0,
    parentLabel: 'Tributos',
  },
  {
    label: 'Detracciones',
    path: '/contabilidad/tributos/detracciones',
    order: 1,
    parentLabel: 'Tributos',
  },
  {
    label: 'Retenciones',
    path: '/contabilidad/tributos/retenciones',
    order: 2,
    parentLabel: 'Tributos',
  },
  {
    label: 'Percepciones',
    path: '/contabilidad/tributos/percepciones',
    order: 3,
    parentLabel: 'Tributos',
  },
  // Libros electrónicos
  {
    label: 'Registro de compras',
    path: '/contabilidad/libros-e/registro-compras',
    order: 0,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'Registro de ventas',
    path: '/contabilidad/libros-e/registro-ventas',
    order: 1,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'Libro diario',
    path: '/contabilidad/libros-e/libro-diario',
    order: 2,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'Libro mayor',
    path: '/contabilidad/libros-e/libro-mayor',
    order: 3,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'Libro caja',
    path: '/contabilidad/libros-e/libro-caja',
    order: 4,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'Libro bancos',
    path: '/contabilidad/libros-e/libro-bancos',
    order: 5,
    parentLabel: 'Libros electrónicos',
  },
  {
    label: 'PLE',
    path: '/contabilidad/libros-e/ple',
    order: 6,
    parentLabel: 'Libros electrónicos',
  },
  // Reportes financieros
  {
    label: 'Balance general',
    path: '/contabilidad/reportes/balance-general',
    order: 0,
    parentLabel: 'Reportes financieros',
  },
  {
    label: 'Estado de resultados',
    path: '/contabilidad/reportes/estado-resultados',
    order: 1,
    parentLabel: 'Reportes financieros',
  },
  {
    label: 'Flujo de caja',
    path: '/contabilidad/reportes/flujo-caja',
    order: 2,
    parentLabel: 'Reportes financieros',
  },
  {
    label: 'Flujo de efectivo',
    path: '/contabilidad/reportes/flujo-efectivo',
    order: 3,
    parentLabel: 'Reportes financieros',
  },
  {
    label: 'Análisis financiero',
    path: '/contabilidad/reportes/analisis-financiero',
    order: 4,
    parentLabel: 'Reportes financieros',
  },
  {
    label: 'KPIs',
    path: '/contabilidad/reportes/kpis',
    order: 5,
    parentLabel: 'Reportes financieros',
  },
];

/** Menús padre reemplazados por la nueva estructura */
export const CONTABILIDAD_DEPRECATED_PARENT_LABELS = [
  'Plan de cuentas',
  'Asientos contables',
  'Bancos',
  'Caja',
  'Impuestos',
  'Reportes',
];

/** Rutas hijas obsoletas */
export const CONTABILIDAD_DEPRECATED_PATHS = [
  '/contabilidad/plan-cuentas/nueva-cuenta',
  '/contabilidad/asientos/nuevo',
  '/contabilidad/compras/registrar',
  '/contabilidad/ventas/nueva-factura',
  '/contabilidad/bancos/cuentas',
  '/contabilidad/bancos/movimientos',
  '/contabilidad/bancos/conciliacion',
  '/contabilidad/caja/chica',
  '/contabilidad/caja/movimientos',
  '/contabilidad/impuestos/igv',
  '/contabilidad/impuestos/renta',
  '/contabilidad/impuestos/declaraciones',
  '/contabilidad/reportes/libro-mayor',
];
