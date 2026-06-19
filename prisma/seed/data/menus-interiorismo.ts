export const INTERIORISMO_APPLICATION_SLUG = 'interiorismo';

/** Retirados del sidebar: presupuesto, compras y liquidación viven en el detalle de Proyecto. */
export const INTERIORISMO_OBSOLETE_PARENT_LABELS = ['Presupuestos', 'Finanzas'] as const;

export const INTERIORISMO_OBSOLETE_MENU_PATH_PREFIXES = [
  '/interiorismo/finanzas',
  '/interiorismo/presupuestos',
] as const;

/**
 * Orden = flujo operativo:
 * Cliente → Proyecto (presupuesto/compras/liquidación) → Materiales → Ejecución → Calendario → Documentos → Reportes → Config
 */
export const INTERIORISMO_PARENT_MENUS = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/interiorismo', order: 0 },
  { label: 'Clientes', icon: 'users', path: null, order: 1 },
  { label: 'Proyectos', icon: 'folder-kanban', path: null, order: 2 },
  { label: 'Materiales', icon: 'layers', path: null, order: 3 },
  { label: 'Ejecución', icon: 'flame', path: '/interiorismo/ejecucion', order: 4 },
  { label: 'Calendario', icon: 'calendar', path: '/interiorismo/calendario', order: 5 },
  { label: 'Documentos', icon: 'files', path: null, order: 6 },
  { label: 'Reportes', icon: 'bar-chart', path: '/interiorismo/reportes', order: 7 },
  { label: 'Configuración', icon: 'settings', path: '/interiorismo/configuracion', order: 8 },
];

export const INTERIORISMO_CHILD_MENUS = [
  // Clientes (primero: todo proyecto requiere cliente)
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

  // Proyectos (presupuesto, compras y liquidación viven en el detalle)
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

  // Materiales (catálogo y proveedores antes de compras en obra)
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

  // Documentos (orden del ciclo de vida del proyecto)
  {
    label: 'Contratos',
    path: '/interiorismo/documentos/contratos',
    order: 0,
    parentLabel: 'Documentos',
  },
  {
    label: 'Planos',
    path: '/interiorismo/documentos/planos',
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
    label: 'PDFs',
    path: '/interiorismo/documentos/pdfs',
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
