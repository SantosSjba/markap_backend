/** Clientes demo Interiorismo (slug interiorismo). Tipos RESIDENTIAL / CORPORATE en BD. */

import { seedPrueba } from './seed-demo-prueba';

export const SAMPLE_INTERIOR_RESIDENTIAL_CLIENT = {
  documentNumber: '44778899',
  fullName: seedPrueba('Ana Torres Vidal'),
  primaryPhone: '987001122',
  primaryEmail: 'ana.torres.prueba@ejemplo.com',
  notes: seedPrueba('Cliente residencial de ejemplo. Prefiere reunión en mañana.'),
};

export const SAMPLE_INTERIOR_CORPORATE_CLIENT = {
  documentNumber: '20601234567',
  fullName: seedPrueba('Oficinas del Sur S.A.C.'),
  legalRepresentativeName: seedPrueba('Carlos Mendoza Ríos'),
  legalRepresentativePosition: 'Gerente General',
  primaryPhone: '014012300',
  primaryEmail: 'proyectos.prueba@oficinasdelsur.ejemplo.com',
  notes: seedPrueba('Cliente corporativo de ejemplo. Contacto comercial vía email.'),
};
