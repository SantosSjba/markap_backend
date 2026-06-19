export const INTERIORISMO_APPLICATION_SLUG = 'interiorismo';

/** Padres con `path: null` cuando tienen submenú (mismo criterio que Ventas). */
export const INTERIORISMO_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/interiorismo', order: 0 },
  { label: 'Proyectos', icon: 'folder-kanban', path: null, order: 1 },
  { label: 'Clientes', icon: 'users', path: null, order: 2 },
  { label: 'Materiales', icon: 'layers', path: null, order: 3 },
  { label: 'Ejecución', icon: 'flame', path: '/interiorismo/ejecucion', order: 4 },
  { label: 'Calendario', icon: 'calendar', path: '/interiorismo/calendario', order: 5 },
  { label: 'Documentos', icon: 'files', path: null, order: 6 },
  { label: 'Configuración', icon: 'settings', path: '/interiorismo/configuracion', order: 7 },
  { label: 'Reportes', icon: 'bar-chart', path: '/interiorismo/reportes', order: 8 },
];

export const INTERIORISMO_CHILD_MENUS = [
  // Proyectos
  {
    label: 'Listado de proyectos',
    path: '/interiorismo/proyectos',
    order: 0,
    parentLabel: 'Proyectos',
  },
  {
    label: 'Nuevo proyecto',
    path: '/interiorismo/proyectos/nuevo',
    order: 1,
    parentLabel: 'Proyectos',
  },
  {
    label: 'En progreso',
    path: '/interiorismo/proyectos/en-progreso',
    order: 2,
    parentLabel: 'Proyectos',
  },

  // Clientes
  {
    label: 'Listado de clientes',
    path: '/interiorismo/clientes',
    order: 0,
    parentLabel: 'Clientes',
  },
  {
    label: 'Nuevo cliente',
    path: '/interiorismo/clientes/nuevo',
    order: 1,
    parentLabel: 'Clientes',
  },

  // Presupuestos — gestionados dentro de Proyectos (tab Presupuesto)

  // Materiales
  {
    label: 'Catálogo',
    path: '/interiorismo/materiales/catalogo',
    order: 0,
    parentLabel: 'Materiales',
  },
  {
    label: 'Proveedores',
    path: '/interiorismo/materiales/proveedores',
    order: 1,
    parentLabel: 'Materiales',
  },

  // Documentos
  {
    label: 'Contratos',
    path: '/interiorismo/documentos/contratos',
    order: 0,
    parentLabel: 'Documentos',
  },
  {
    label: 'PDFs',
    path: '/interiorismo/documentos/pdfs',
    order: 1,
    parentLabel: 'Documentos',
  },
  {
    label: 'Renderizados',
    path: '/interiorismo/documentos/renderizados',
    order: 2,
    parentLabel: 'Documentos',
  },
  {
    label: 'Planos',
    path: '/interiorismo/documentos/planos',
    order: 3,
    parentLabel: 'Documentos',
  },
  {
    label: 'Facturas',
    path: '/interiorismo/documentos/facturas',
    order: 4,
    parentLabel: 'Documentos',
  },
  {
    label: 'Actas',
    path: '/interiorismo/documentos/actas',
    order: 5,
    parentLabel: 'Documentos',
  },
];
