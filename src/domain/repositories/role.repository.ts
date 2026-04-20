import { Role } from '../entities';

export type CreateRoleData = Pick<Role, 'name' | 'code' | 'description' | 'isActive'> & {
  deletedAt?: Date | null;
};

/**
 * Role Repository Interface
 * Defines the contract for role data access
 */
export interface RoleRepository {
  /**
   * Find all active roles
   */
  findAll(): Promise<Role[]>;

  /**
   * Find role by ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Find role by code
   */
  findByCode(code: string): Promise<Role | null>;

  /**
   * Find roles by user ID
   */
  findByUserId(userId: string): Promise<Role[]>;

  /**
   * Create a new role
   */
  create(role: CreateRoleData): Promise<Role>;

  /**
   * Update an existing role
   */
  update(id: string, data: Partial<Role>): Promise<Role>;

  /**
   * Soft delete a role
   */
  delete(id: string): Promise<void>;

  /**
   * Assign role to user
   */
  assignToUser(userId: string, roleId: string, assignedBy?: string): Promise<void>;

  /**
   * Revoke role from user
   */
  revokeFromUser(userId: string, roleId: string, revokedBy?: string): Promise<void>;

  /**
   * Assign application to role
   */
  assignApplication(roleId: string, applicationId: string): Promise<void>;

  /**
   * Revoke application from role
   */
  revokeApplication(roleId: string, applicationId: string): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('RoleRepository');
