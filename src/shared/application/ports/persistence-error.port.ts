/** Clasifica fallos del adaptador sin exponer el ORM a la aplicación. */
export abstract class PersistenceErrorPort {
  abstract isKnown(error: unknown): boolean;
  abstract isUniqueConflict(error: unknown): boolean;
}
