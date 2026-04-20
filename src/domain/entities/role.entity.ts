/**
 * Role Entity
 * Represents a role in the domain layer
 */
export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null,
  ) {}

  /**
   * Check if the role is deleted (soft delete)
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Create a new Role instance
   */
  static create(props: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }): Role {
    return new Role(
      props.id,
      props.name,
      props.code,
      props.description ?? null,
      props.isActive ?? true,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.deletedAt ?? null,
    );
  }
}
