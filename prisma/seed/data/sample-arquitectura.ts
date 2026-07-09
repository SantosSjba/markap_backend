/** Clientes y configuración demo Arquitectura (slug arquitectura). */

import { seedPrueba } from './seed-demo-prueba';

export const SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT = {
  documentNumber: '44889900',
  fullName: seedPrueba('Luis Herrera Campos'),
  primaryPhone: '987112200',
  primaryEmail: 'luis.herrera.prueba@ejemplo.com',
  notes: seedPrueba('Cliente residencial demo. Proyecto vivienda unifamiliar en etapa de obra.'),
};

export const SAMPLE_ARQUITECTURA_CORPORATE_CLIENT = {
  documentNumber: '20602345678',
  fullName: seedPrueba('Centro Médico Pacífico S.A.C.'),
  legalRepresentativeName: seedPrueba('Dra. Patricia Núñez Vega'),
  legalRepresentativePosition: 'Directora General',
  primaryPhone: '014567890',
  primaryEmail: 'proyectos.prueba@cmpacifico.ejemplo.com',
  notes: seedPrueba('Cliente institucional demo. Ampliación clínica ambulatoria.'),
};

export const ARQUITECTURA_DEMO_PROJECT_CODES = {
  residential: 'ARQ-REM-LIM-001',
  commercial: 'ARQ-COM-LIM-002',
} as const;

export const ARQUITECTURA_CONFIG_DEFAULTS = {
  projectStages: [
    { code: 'DESIGN', label: 'Anteproyecto', sortOrder: 0 },
    { code: 'QUOTE', label: 'Cotización', sortOrder: 1 },
    { code: 'APPROVED', label: 'Aprobación', sortOrder: 2 },
    { code: 'IN_PROGRESS', label: 'Obra', sortOrder: 3 },
    { code: 'FINISHED', label: 'Finalizado', sortOrder: 4 },
  ],
  numbering: [{ seriesKey: 'ARQUITECTURA_PROJECT', prefix: 'ARQ-PRY' }],
} as const;
