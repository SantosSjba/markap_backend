export const PRODUCCION_APPLICATION_SLUG = 'produccion';

export const PRODUCCION_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/produccion', order: 0 },
  { label: 'Órdenes de trabajo', icon: 'clipboard-list', path: null, order: 1 },
  { label: 'Productos', icon: 'boxes', path: null, order: 2 },
  { label: 'Inventario', icon: 'warehouse', path: null, order: 3 },
  { label: 'Proveedores', icon: 'truck', path: null, order: 4 },
  { label: 'Producción', icon: 'kanban', path: null, order: 5 },
  { label: 'Reportes', icon: 'bar-chart', path: '/produccion/reportes', order: 6 },
  { label: 'Configuración', icon: 'settings', path: '/produccion/configuracion', order: 7 },
];

export const PRODUCCION_CHILD_MENUS = [
  // Órdenes de trabajo
  {
    label: 'Listado de órdenes',
    path: '/produccion/ordenes-trabajo',
    order: 0,
    parentLabel: 'Órdenes de trabajo',
  },
  {
    label: 'Nueva orden',
    path: '/produccion/ordenes-trabajo/nueva',
    order: 1,
    parentLabel: 'Órdenes de trabajo',
  },
  {
    label: 'En proceso',
    path: '/produccion/ordenes-trabajo/en-proceso',
    order: 2,
    parentLabel: 'Órdenes de trabajo',
  },
  // Productos
  {
    label: 'Catálogo',
    path: '/produccion/productos',
    order: 0,
    parentLabel: 'Productos',
  },
  {
    label: 'Nuevo producto',
    path: '/produccion/productos/nuevo',
    order: 1,
    parentLabel: 'Productos',
  },
  // Inventario
  {
    label: 'Materiales',
    path: '/produccion/inventario/materiales',
    order: 0,
    parentLabel: 'Inventario',
  },
  {
    label: 'Insumos',
    path: '/produccion/inventario/insumos',
    order: 1,
    parentLabel: 'Inventario',
  },
  {
    label: 'Movimientos',
    path: '/produccion/inventario/movimientos',
    order: 2,
    parentLabel: 'Inventario',
  },
  // Proveedores
  {
    label: 'Listado',
    path: '/produccion/proveedores',
    order: 0,
    parentLabel: 'Proveedores',
  },
  {
    label: 'Nuevo proveedor',
    path: '/produccion/proveedores/nuevo',
    order: 1,
    parentLabel: 'Proveedores',
  },
  {
    label: 'Órdenes de compra',
    path: '/produccion/proveedores/ordenes-compra',
    order: 2,
    parentLabel: 'Proveedores',
  },
  // Producción (etapas)
  {
    label: 'Planificación',
    path: '/produccion/etapas/planificacion',
    order: 0,
    parentLabel: 'Producción',
  },
  {
    label: 'Corte',
    path: '/produccion/etapas/corte',
    order: 1,
    parentLabel: 'Producción',
  },
  {
    label: 'Ensamble',
    path: '/produccion/etapas/ensamble',
    order: 2,
    parentLabel: 'Producción',
  },
  {
    label: 'Acabados',
    path: '/produccion/etapas/acabados',
    order: 3,
    parentLabel: 'Producción',
  },
];
