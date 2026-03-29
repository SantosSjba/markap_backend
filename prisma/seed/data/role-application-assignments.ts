export const ROLE_APPLICATION_ASSIGNMENTS = [
  {
    roleCode: 'MANAGER',
    slugs: [
      'alquileres',
      'ventas',
      'interiorismo',
      'arquitectura',
      'produccion',
      'contabilidad',
    ],
    label: 'Gerente',
  },
  {
    roleCode: 'ADMIN_CONTAB',
    slugs: ['alquileres', 'contabilidad'],
    label: 'Administración y contabilidad',
  },
  {
    roleCode: 'ASIST_ARQUITECTURA',
    slugs: ['arquitectura'],
    label: 'Asistente de arquitectura',
  },
  {
    roleCode: 'ASIST_ADMIN',
    slugs: ['alquileres', 'ventas', 'contabilidad'],
    label: 'Asistente Administrativo',
  },
];
