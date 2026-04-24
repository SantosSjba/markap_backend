export const ARQUITECTURA_APPLICATION_SLUG = 'arquitectura';

export const ARQUITECTURA_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/arquitectura', order: 0 },
  { label: 'Proyectos', icon: 'folder-kanban', path: null, order: 1 },
  { label: 'Clientes', icon: 'users', path: null, order: 2 },
  { label: 'Presupuestos', icon: 'file-text', path: null, order: 3 },
  { label: 'Cronograma', icon: 'calendar-range', path: '/arquitectura/cronograma', order: 4 },
  { label: 'Reportes', icon: 'bar-chart', path: '/arquitectura/reportes', order: 5 },
  { label: 'Configuración', icon: 'settings', path: '/arquitectura/configuracion', order: 6 },
];

export const ARQUITECTURA_CHILD_MENUS = [
  {
    label: 'Listado de proyectos',
    path: '/arquitectura/proyectos',
    order: 0,
    parentLabel: 'Proyectos',
  },
  {
    label: 'Nuevo proyecto',
    path: '/arquitectura/proyectos/nuevo',
    order: 1,
    parentLabel: 'Proyectos',
  },
  {
    label: 'En ejecución',
    path: '/arquitectura/proyectos/en-ejecucion',
    order: 2,
    parentLabel: 'Proyectos',
  },
  {
    label: 'Listado de clientes',
    path: '/arquitectura/clientes',
    order: 0,
    parentLabel: 'Clientes',
  },
  {
    label: 'Nuevo cliente',
    path: '/arquitectura/clientes/nuevo',
    order: 1,
    parentLabel: 'Clientes',
  },
  {
    label: 'Listado',
    path: '/arquitectura/presupuestos',
    order: 0,
    parentLabel: 'Presupuestos',
  },
  {
    label: 'Nuevo presupuesto',
    path: '/arquitectura/presupuestos/nuevo',
    order: 1,
    parentLabel: 'Presupuestos',
  },
];
