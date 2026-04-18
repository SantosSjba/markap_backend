export const VENTAS_APPLICATION_SLUG = 'ventas';

export const VENTAS_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/ventas', order: 0 },

  { label: 'Clientes', icon: 'users', path: null, order: 1 },

  { label: 'Propiedades', icon: 'building', path: null, order: 2 },

  { label: 'Agentes', icon: 'user-check', path: null, order: 3 },

  { label: 'Ventas', icon: 'file-text', path: null, order: 4 },

  { label: 'Finanzas', icon: 'dollar-sign', path: null, order: 5 },

  { label: 'Reportes', icon: 'bar-chart', path: '/ventas/reportes', order: 6 },

  { label: 'Configuración', icon: 'settings', path: '/ventas/configuracion', order: 7 },
];

export const VENTAS_CHILD_MENUS = [
  // Clientes
  { label: 'Listado de Clientes', path: '/ventas/clientes', order: 0, parentLabel: 'Clientes' },
  { label: 'Nuevo Cliente', path: '/ventas/clientes/nuevo', order: 1, parentLabel: 'Clientes' },

  // Propiedades
  { label: 'Listado de Propiedades', path: '/ventas/propiedades', order: 0, parentLabel: 'Propiedades' },
  { label: 'Nueva Propiedad', path: '/ventas/propiedades/nueva', order: 1, parentLabel: 'Propiedades' },

  // Agentes
  { label: 'Listado de Agentes', path: '/ventas/agentes', order: 0, parentLabel: 'Agentes' },
  { label: 'Nuevo Agente', path: '/ventas/agentes/nuevo', order: 1, parentLabel: 'Agentes' },

  // Ventas (antes Negociaciones)
  { label: 'Procesos de Venta', path: '/ventas/procesos', order: 0, parentLabel: 'Ventas' },
  { label: 'Separaciones', path: '/ventas/separaciones', order: 1, parentLabel: 'Ventas' },
  { label: 'Cierres', path: '/ventas/cierres', order: 2, parentLabel: 'Ventas' },

  // Finanzas
  { label: 'Pagos', path: '/ventas/pagos', order: 0, parentLabel: 'Finanzas' },
  { label: 'Comisiones', path: '/ventas/comisiones', order: 1, parentLabel: 'Finanzas' },
  { label: 'Costos de Documentación', path: '/ventas/costos-documentacion', order: 2, parentLabel: 'Finanzas' },
];