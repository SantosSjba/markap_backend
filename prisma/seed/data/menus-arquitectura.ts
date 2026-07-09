export const ARQUITECTURA_APPLICATION_SLUG = 'arquitectura';

/**
 * Orden = flujo operativo:
 * Cliente → Proyecto → Presupuesto → Cronograma → Documentos → Reportes → Config
 */
export const ARQUITECTURA_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/arquitectura', order: 0 },
  { label: 'Clientes', icon: 'users', path: null, order: 1 },
  { label: 'Proyectos', icon: 'folder-kanban', path: null, order: 2 },
  { label: 'Presupuestos', icon: 'file-text', path: null, order: 3 },
  { label: 'Cronograma', icon: 'calendar-range', path: '/arquitectura/cronograma', order: 4 },
  { label: 'Documentos', icon: 'files', path: null, order: 5 },
  { label: 'Reportes', icon: 'bar-chart', path: '/arquitectura/reportes', order: 6 },
  { label: 'Configuración', icon: 'settings', path: '/arquitectura/configuracion', order: 7 },
];

export const ARQUITECTURA_CHILD_MENUS = [
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
  { label: 'Contratos', path: '/arquitectura/documentos/contratos', order: 0, parentLabel: 'Documentos' },
  { label: 'Planos', path: '/arquitectura/documentos/planos', order: 1, parentLabel: 'Documentos' },
  { label: 'Renders', path: '/arquitectura/documentos/renders', order: 2, parentLabel: 'Documentos' },
  {
    label: 'Memoria descriptiva',
    path: '/arquitectura/documentos/memoria-descriptiva',
    order: 3,
    parentLabel: 'Documentos',
  },
  { label: 'Facturas', path: '/arquitectura/documentos/facturas', order: 4, parentLabel: 'Documentos' },
  { label: 'Actas', path: '/arquitectura/documentos/actas', order: 5, parentLabel: 'Documentos' },
];
