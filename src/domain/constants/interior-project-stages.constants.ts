import type { InteriorismoProjectStageInput } from '@domain/repositories/interiorismo-config.repository';

/** Etapas del ciclo comercial de un proyecto de interiorismo (orden fijo). */
export const INTERIOR_PROJECT_LIFECYCLE_STAGES: InteriorismoProjectStageInput[] = [
  { code: 'DESIGN', label: 'Diseño', sortOrder: 0, isActive: true },
  { code: 'QUOTE', label: 'Cotización', sortOrder: 1, isActive: true },
  { code: 'APPROVED', label: 'Aprobación', sortOrder: 2, isActive: true },
  { code: 'IN_PROGRESS', label: 'Ejecución', sortOrder: 3, isActive: true },
  { code: 'FINISHED', label: 'Finalizado', sortOrder: 4, isActive: true },
];

export const INTERIOR_PROJECT_LIFECYCLE_CODES = INTERIOR_PROJECT_LIFECYCLE_STAGES.map(
  (s) => s.code,
) as [
  'DESIGN',
  'QUOTE',
  'APPROVED',
  'IN_PROGRESS',
  'FINISHED',
];

export const INTERIOR_PROJECT_LIFECYCLE_CODE_SET = new Set<string>(
  INTERIOR_PROJECT_LIFECYCLE_CODES,
);

/** Estados persistidos en `interior_projects.status` (ciclo + cancelación). */
export const INTERIOR_PROJECT_STATUS_CODES = [
  ...INTERIOR_PROJECT_LIFECYCLE_CODES,
  'CANCELLED',
] as const;

export type InteriorProjectLifecycleCode = (typeof INTERIOR_PROJECT_LIFECYCLE_CODES)[number];
export type InteriorProjectStatusCode = (typeof INTERIOR_PROJECT_STATUS_CODES)[number];

/** Etapas obsoletas reemplazadas en migraciones de configuración. */
export const INTERIOR_PROJECT_LEGACY_STAGE_CODES = ['PROSPECT', 'CANCELLED'] as const;

/** Estados activos (excluye finalizado y cancelado). */
export const INTERIOR_PROJECT_ACTIVE_STATUS_CODES = [
  'DESIGN',
  'QUOTE',
  'APPROVED',
  'IN_PROGRESS',
] as const;
