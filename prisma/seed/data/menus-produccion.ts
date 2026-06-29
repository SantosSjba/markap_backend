export const PRODUCCION_APPLICATION_SLUG = 'produccion';

/**
 * Orden = flujo operativo (como Interiorismo):
 * Cliente → Catálogo → Costos → Compras → Inventario → Producción → Ventas → Reportes → Config
 */
export const PRODUCCION_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/produccion', order: 0 },
  { label: 'Clientes', icon: 'users', path: null, order: 1 },
  { label: 'Catálogo de muebles', icon: 'boxes', path: null, order: 2 },
  { label: 'Costos', icon: 'calculator', path: null, order: 3 },
  { label: 'Compras', icon: 'shopping-cart', path: null, order: 4 },
  { label: 'Inventario', icon: 'warehouse', path: null, order: 5 },
  { label: 'Producción', icon: 'kanban', path: null, order: 6 },
  { label: 'Ventas', icon: 'receipt', path: null, order: 7 },
  { label: 'Reportes', icon: 'bar-chart', path: '/produccion/reportes', order: 8 },
  { label: 'Configuración', icon: 'settings', path: '/produccion/configuracion', order: 9 },
];

export const PRODUCCION_CHILD_MENUS = [
  // Clientes (primero: cotización y pedido requieren cliente)
  {
    label: 'Listado de clientes',
    path: '/produccion/clientes',
    order: 0,
    parentLabel: 'Clientes',
  },
  {
    label: 'Nuevo cliente',
    path: '/produccion/clientes/nuevo',
    order: 1,
    parentLabel: 'Clientes',
  },
  // Catálogo de muebles
  {
    label: 'Catálogo',
    path: '/produccion/catalogo',
    order: 0,
    parentLabel: 'Catálogo de muebles',
  },
  {
    label: 'Nuevo mueble',
    path: '/produccion/catalogo/nuevo',
    order: 1,
    parentLabel: 'Catálogo de muebles',
  },
  // Producción
  {
    label: 'Órdenes de trabajo',
    path: '/produccion/ordenes-trabajo',
    order: 0,
    parentLabel: 'Producción',
  },
  {
    label: 'Producción en proceso',
    path: '/produccion/produccion/en-proceso',
    order: 1,
    parentLabel: 'Producción',
  },
  {
    label: 'Etapas de producción',
    path: '/produccion/produccion/etapas',
    order: 2,
    parentLabel: 'Producción',
  },
  {
    label: 'Productos terminados',
    path: '/produccion/produccion/terminados',
    order: 3,
    parentLabel: 'Producción',
  },
  // Inventario
  {
    label: 'Materiales',
    path: '/produccion/inventario/materiales',
    order: 0,
    parentLabel: 'Inventario',
  },
  {
    label: 'Stock',
    path: '/produccion/inventario/stock',
    order: 1,
    parentLabel: 'Inventario',
  },
  {
    label: 'Movimientos',
    path: '/produccion/inventario/movimientos',
    order: 2,
    parentLabel: 'Inventario',
  },
  // Compras
  {
    label: 'Proveedores',
    path: '/produccion/compras/proveedores',
    order: 0,
    parentLabel: 'Compras',
  },
  {
    label: 'Órdenes de compra',
    path: '/produccion/compras/ordenes-compra',
    order: 1,
    parentLabel: 'Compras',
  },
  // Ventas
  {
    label: 'Cotizaciones',
    path: '/produccion/ventas/cotizaciones',
    order: 0,
    parentLabel: 'Ventas',
  },
  {
    label: 'Pedidos',
    path: '/produccion/ventas/pedidos',
    order: 1,
    parentLabel: 'Ventas',
  },
  {
    label: 'Entregas',
    path: '/produccion/ventas/entregas',
    order: 2,
    parentLabel: 'Ventas',
  },
  // Costos
  {
    label: 'Costeo de muebles',
    path: '/produccion/costos/costeo',
    order: 0,
    parentLabel: 'Costos',
  },
  {
    label: 'Mano de obra',
    path: '/produccion/costos/mano-obra',
    order: 1,
    parentLabel: 'Costos',
  },
  {
    label: 'Gastos adicionales',
    path: '/produccion/costos/gastos',
    order: 2,
    parentLabel: 'Costos',
  },
];

/** Menús padre reemplazados por la nueva estructura */
export const PRODUCCION_DEPRECATED_PARENT_LABELS = [
  'Productos',
  'Proveedores',
  'Órdenes de trabajo',
];

/** Rutas hijas obsoletas (se desactivan tras el seed) */
export const PRODUCCION_DEPRECATED_PATHS = [
  '/produccion/productos',
  '/produccion/productos/nuevo',
  '/produccion/inventario/insumos',
  '/produccion/proveedores',
  '/produccion/proveedores/nuevo',
  '/produccion/proveedores/ordenes-compra',
  '/produccion/ordenes-trabajo/nueva',
  '/produccion/ordenes-trabajo/en-proceso',
  '/produccion/etapas/planificacion',
  '/produccion/etapas/corte',
  '/produccion/etapas/ensamble',
  '/produccion/etapas/acabados',
  '/produccion/ventas/clientes',
  '/produccion/ventas/clientes/nuevo',
];
