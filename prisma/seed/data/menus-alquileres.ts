export const ALQUILERES_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/alquileres', order: 0 },
  { label: 'Clientes', icon: 'users', path: '/alquileres/clientes', order: 1 },
  { label: 'Propiedades', icon: 'building', path: null, order: 2 },
  { label: 'Alquileres', icon: 'file-text', path: '/alquileres/contratos', order: 3 },
  { label: 'Agentes', icon: 'user-check', path: '/alquileres/agentes', order: 4 },
  { label: 'Cobranzas', icon: 'credit-card', path: '/alquileres/cobranzas', order: 5 },
  { label: 'Reportes', icon: 'bar-chart', path: '/alquileres/reportes', order: 6 },
  { label: 'Configuración', icon: 'settings', path: '/alquileres/configuracion', order: 7 },
];

export const ALQUILERES_CHILD_MENUS = [
  { label: 'Listado de Clientes', path: '/alquileres/clientes', order: 0, parentLabel: 'Clientes' },
  { label: 'Nuevo Cliente', path: '/alquileres/clientes/nuevo', order: 1, parentLabel: 'Clientes' },
  { label: 'Listado de Propiedades', path: '/alquileres/propiedades', order: 0, parentLabel: 'Propiedades' },
  { label: 'Nueva Propiedad', path: '/alquileres/propiedades/nueva', order: 1, parentLabel: 'Propiedades' },
  { label: 'Listado de Alquileres', path: '/alquileres/contratos', order: 0, parentLabel: 'Alquileres' },
  { label: 'Nuevo Alquiler', path: '/alquileres/contratos/nuevo', order: 1, parentLabel: 'Alquileres' },
  { label: 'Listado de Agentes', path: '/alquileres/agentes', order: 0, parentLabel: 'Agentes' },
  { label: 'Nuevo Agente', path: '/alquileres/agentes/nuevo', order: 1, parentLabel: 'Agentes' },
  { label: 'Pagos Pendientes', path: '/alquileres/cobranzas', order: 0, parentLabel: 'Cobranzas' },
  { label: 'Historial de Pagos', path: '/alquileres/cobranzas/historial', order: 1, parentLabel: 'Cobranzas' },
  { label: 'Con Atraso', path: '/alquileres/cobranzas/atrasos', order: 2, parentLabel: 'Cobranzas' },
];
