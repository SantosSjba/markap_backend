import { Application } from '../entities';

export type CreateApplicationData = Pick<
  Application,
  | 'name'
  | 'slug'
  | 'description'
  | 'icon'
  | 'color'
  | 'url'
  | 'activeCount'
  | 'pendingCount'
  | 'isActive'
  | 'order'
> & {
  deletedAt?: Date | null;
};

/**
 * Application Repository Interface
 * Defines the contract for application data access
 */
export interface ApplicationRepository {
  /**
   * Find all active applications
   */
  findAll(): Promise<Application[]>;

  /**
   * Find application by ID
   */
  findById(id: string): Promise<Application | null>;

  /**
   * Find application by slug
   */
  findBySlug(slug: string): Promise<Application | null>;

  /**
   * Find applications by user ID (through roles)
   */
  findByUserId(userId: string): Promise<Application[]>;

  /**
   * Find applications by role ID
   */
  findByRoleId(roleId: string): Promise<Application[]>;

  /**
   * Create a new application
   */
  create(application: CreateApplicationData): Promise<Application>;

  /**
   * Update an existing application
   */
  update(id: string, data: Partial<Application>): Promise<Application>;

  /**
   * Soft delete an application
   */
  delete(id: string): Promise<void>;
}

export const APPLICATION_REPOSITORY = Symbol('ApplicationRepository');
