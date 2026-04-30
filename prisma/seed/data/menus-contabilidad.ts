export const CONTABILIDAD_APPLICATION_SLUG = 'contabilidad';

export const CONTABILIDAD_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/contabilidad', order: 0 },
  { label: 'Plan de cuentas', icon: 'list-tree', path: null, order: 1 },
  { label: 'Asientos contables', icon: 'book-open', path: null, order: 2 },
  { label: 'Compras', icon: 'shopping-cart', path: null, order: 3 },
  { label: 'Ventas', icon: 'receipt', path: null, order: 4 },
  { label: 'Bancos', icon: 'landmark', path: null, order: 5 },
  { label: 'Caja', icon: 'wallet', path: null, order: 6 },
  { label: 'Impuestos', icon: 'percent', path: null, order: 7 },
  { label: 'Reportes', icon: 'pie-chart', path: null, order: 8 },
  { label: 'Configuración', icon: 'settings', path: '/contabilidad/configuracion', order: 9 },
];

export const CONTABILIDAD_CHILD_MENUS = [
  {
    label: 'Plan contable',
    path: '/contabilidad/plan-cuentas',
    order: 0,
    parentLabel: 'Plan de cuentas',
  },
  {
    label: 'Nueva cuenta',
    path: '/contabilidad/plan-cuentas/nueva-cuenta',
    order: 1,
    parentLabel: 'Plan de cuentas',
  },
  {
    label: 'Libro diario',
    path: '/contabilidad/asientos/libro-diario',
    order: 0,
    parentLabel: 'Asientos contables',
  },
  {
    label: 'Nuevo asiento',
    path: '/contabilidad/asientos/nuevo',
    order: 1,
    parentLabel: 'Asientos contables',
  },
  {
    label: 'Facturas de compra',
    path: '/contabilidad/compras/facturas',
    order: 0,
    parentLabel: 'Compras',
  },
  {
    label: 'Registrar compra',
    path: '/contabilidad/compras/registrar',
    order: 1,
    parentLabel: 'Compras',
  },
  {
    label: 'Facturas de venta',
    path: '/contabilidad/ventas/facturas',
    order: 0,
    parentLabel: 'Ventas',
  },
  {
    label: 'Nueva factura',
    path: '/contabilidad/ventas/nueva-factura',
    order: 1,
    parentLabel: 'Ventas',
  },
  {
    label: 'Cuentas bancarias',
    path: '/contabilidad/bancos/cuentas',
    order: 0,
    parentLabel: 'Bancos',
  },
  {
    label: 'Movimientos',
    path: '/contabilidad/bancos/movimientos',
    order: 1,
    parentLabel: 'Bancos',
  },
  {
    label: 'Conciliación',
    path: '/contabilidad/bancos/conciliacion',
    order: 2,
    parentLabel: 'Bancos',
  },
  {
    label: 'Caja chica',
    path: '/contabilidad/caja/chica',
    order: 0,
    parentLabel: 'Caja',
  },
  {
    label: 'Movimientos',
    path: '/contabilidad/caja/movimientos',
    order: 1,
    parentLabel: 'Caja',
  },
  {
    label: 'IGV',
    path: '/contabilidad/impuestos/igv',
    order: 0,
    parentLabel: 'Impuestos',
  },
  {
    label: 'Impuesto a la renta',
    path: '/contabilidad/impuestos/renta',
    order: 1,
    parentLabel: 'Impuestos',
  },
  {
    label: 'Declaraciones',
    path: '/contabilidad/impuestos/declaraciones',
    order: 2,
    parentLabel: 'Impuestos',
  },
  {
    label: 'Balance general',
    path: '/contabilidad/reportes/balance-general',
    order: 0,
    parentLabel: 'Reportes',
  },
  {
    label: 'Estado de resultados',
    path: '/contabilidad/reportes/estado-resultados',
    order: 1,
    parentLabel: 'Reportes',
  },
  {
    label: 'Libro mayor',
    path: '/contabilidad/reportes/libro-mayor',
    order: 2,
    parentLabel: 'Reportes',
  },
  {
    label: 'Flujo de caja',
    path: '/contabilidad/reportes/flujo-caja',
    order: 3,
    parentLabel: 'Reportes',
  },
];
