export const VENTAS_APPLICATION_SLUG = 'ventas';

export const VENTAS_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/ventas', order: 0 },
  { label: 'Clientes', icon: 'users', path: null, order: 1 },
  { label: 'Propiedades', icon: 'building', path: null, order: 2 },
  { label: 'Negociaciones', icon: 'file-text', path: '/ventas/negociaciones', order: 3 },
  { label: 'Comisiones', icon: 'dollar-sign', path: '/ventas/comisiones', order: 4 },
  { label: 'Reportes', icon: 'bar-chart', path: '/ventas/reportes', order: 5 },
  { label: 'Configuración', icon: 'settings', path: '/ventas/configuracion', order: 6 },
];

export const VENTAS_CHILD_MENUS = [
  { label: 'Listado de Clientes', path: '/ventas/clientes', order: 0, parentLabel: 'Clientes' },
  { label: 'Nuevo Cliente', path: '/ventas/clientes/nuevo', order: 1, parentLabel: 'Clientes' },
  { label: 'Listado de Propiedades', path: '/ventas/propiedades', order: 0, parentLabel: 'Propiedades' },
  { label: 'Nueva Propiedad', path: '/ventas/propiedades/nueva', order: 1, parentLabel: 'Propiedades' },
];
