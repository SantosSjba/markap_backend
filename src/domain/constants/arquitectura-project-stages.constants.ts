import type { ArquitecturaProjectStageInput } from '@domain/repositories/arquitectura-config.repository';

/** Etapas del ciclo comercial de un proyecto de arquitectura (orden fijo). */
export const ARQUITECTURA_PROJECT_LIFECYCLE_STAGES: ArquitecturaProjectStageInput[] = [
  { code: 'DESIGN', label: 'Anteproyecto', sortOrder: 0, isActive: true },
  { code: 'QUOTE', label: 'Cotización', sortOrder: 1, isActive: true },
  { code: 'APPROVED', label: 'Aprobación', sortOrder: 2, isActive: true },
  { code: 'IN_PROGRESS', label: 'Obra', sortOrder: 3, isActive: true },
  { code: 'FINISHED', label: 'Finalizado', sortOrder: 4, isActive: true },
];

export const ARQUITECTURA_PROJECT_LIFECYCLE_CODES = ARQUITECTURA_PROJECT_LIFECYCLE_STAGES.map(
  (s) => s.code,
) as [
  'DESIGN',
  'QUOTE',
  'APPROVED',
  'IN_PROGRESS',
  'FINISHED',
];

export const ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET = new Set<string>(
  ARQUITECTURA_PROJECT_LIFECYCLE_CODES,
);

/** Estados persistidos en `arquitectura_projects.status` (ciclo + cancelación). */
export const ARQUITECTURA_PROJECT_STATUS_CODES = [
  ...ARQUITECTURA_PROJECT_LIFECYCLE_CODES,
  'CANCELLED',
] as const;

export type ArquitecturaProjectLifecycleCode = (typeof ARQUITECTURA_PROJECT_LIFECYCLE_CODES)[number];
export type ArquitecturaProjectStatusCode = (typeof ARQUITECTURA_PROJECT_STATUS_CODES)[number];

/** Etapas obsoletas reemplazadas en migraciones de configuración. */
export const ARQUITECTURA_PROJECT_LEGACY_STAGE_CODES = ['PROSPECT', 'CANCELLED'] as const;

/** Estados activos (excluye finalizado y cancelado). */
export const ARQUITECTURA_PROJECT_ACTIVE_STATUS_CODES = [
  'DESIGN',
  'QUOTE',
  'APPROVED',
  'IN_PROGRESS',
] as const;

/** Filtro «en ejecución»: obra aprobada o en curso. */
export const ARQUITECTURA_PROJECT_IN_EXECUTION_STATUS_CODES = [
  'APPROVED',
  'IN_PROGRESS',
] as const;

export const ARQUITECTURA_PROJECT_TYPES = [
  'RESIDENTIAL',
  'COMMERCIAL',
  'INSTITUTIONAL',
  'MIXED_USE',
  'URBAN',
] as const;

export type ArquitecturaProjectTypeCode = (typeof ARQUITECTURA_PROJECT_TYPES)[number];
