/**
 * User Entity - Domain Model
 *
 * Representa el modelo de dominio para usuarios del sistema.
 * Esta entidad es independiente de cualquier framework o base de datos.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null,
    public readonly deletedAt: Date | null,
    public readonly deletedBy: string | null,
  ) {}

  /**
   * Obtiene el nombre completo del usuario
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Verifica si el usuario está eliminado (soft delete)
   */
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Verifica si el usuario puede autenticarse
   */
  get canAuthenticate(): boolean {
    return this.isActive && !this.isDeleted;
  }
}
