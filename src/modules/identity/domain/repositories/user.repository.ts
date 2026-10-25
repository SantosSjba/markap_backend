import { User } from '../entities/user.entity';

/**
 * Rol resumido para listados (capa aplicación)
 */
export interface UserRoleItem {
  id: string;
  name: string;
  code: string;
}

/**
 * Usuario con roles para listados y respuestas API (capa aplicación)
 */
export interface UserWithRolesListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  userRoles: Array<{ role: UserRoleItem }>;
}

/**
 * Datos requeridos para crear un usuario
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdBy?: string;
}

/**
 * Datos para actualizar un usuario
 */
export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  updatedBy?: string;
}

/**
 * Datos para soft delete
 */
export interface SoftDeleteUserData {
  deletedBy?: string;
}

/**
 * User Repository Interface
 *
 * Define el contrato para el repositorio de usuarios.
 * La implementación concreta puede usar cualquier ORM o base de datos.
 */
export abstract class UserRepository {
  /**
   * Busca todos los usuarios activos (no eliminados)
   */
  abstract findAll(): Promise<User[]>;

  /**
   * Busca todos los usuarios con sus roles activos (para listados API)
   */
  abstract findAllWithRoles(): Promise<UserWithRolesListItem[]>;

  /**
   * Busca un usuario por ID con sus roles activos
   */
  abstract findByIdWithRoles(id: string): Promise<UserWithRolesListItem | null>;

  /**
   * Busca un usuario por su ID
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su email
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por email incluyendo eliminados (para validar unicidad)
   */
  abstract findByEmailIncludingDeleted(email: string): Promise<User | null>;

  /**
   * Crea un nuevo usuario
   */
  abstract create(data: CreateUserData): Promise<User>;

  /**
   * Actualiza un usuario existente
   */
  abstract update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Elimina un usuario de forma suave (soft delete)
   */
  abstract softDelete(id: string, data: SoftDeleteUserData): Promise<User>;

  /**
   * Restaura un usuario eliminado
   */
  abstract restore(id: string, updatedBy?: string): Promise<User>;

  /**
   * Verifica si existe un usuario con el email dado
   */
  abstract existsByEmail(email: string): Promise<boolean>;
}
