/**
 * Application Entity
 * Represents an application/module in the domain layer
 */
export class Application {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly url: string | null,
    public readonly activeCount: number,
    public readonly pendingCount: number,
    public readonly isActive: boolean,
    public readonly order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null,
  ) {}

  /**
   * Check if the application is deleted (soft delete)
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Create a new Application instance
   */
  static create(props: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    url?: string | null;
    activeCount?: number;
    pendingCount?: number;
    isActive?: boolean;
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }): Application {
    return new Application(
      props.id,
      props.name,
      props.slug,
      props.description ?? null,
      props.icon ?? null,
      props.color ?? null,
      props.url ?? null,
      props.activeCount ?? 0,
      props.pendingCount ?? 0,
      props.isActive ?? true,
      props.order ?? 0,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.deletedAt ?? null,
    );
  }
}
