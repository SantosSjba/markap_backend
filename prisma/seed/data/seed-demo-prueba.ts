/**
 * Sufijo para identificar registros de negocio creados por el seed (no catálogos del sistema).
 * No aplicar a: tipos de documento, tipos de propiedad, ubigeo, menús, roles, aplicaciones.
 */
export const SEED_PRUEBA_SUFFIX = '-Prueba';

/** Añade el sufijo si el texto aún no lo termina con él. */
export function seedPrueba(label: string): string {
  const s = label.trim();
  if (s.endsWith(SEED_PRUEBA_SUFFIX)) return s;
  return `${s}${SEED_PRUEBA_SUFFIX}`;
}
