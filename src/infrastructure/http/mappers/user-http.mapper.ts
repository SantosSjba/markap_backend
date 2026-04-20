import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import type { UserWithRolesListItem } from '@domain/repositories/user.repository';
import {
  UserResponseDto,
  UserRoleDto,
} from '../dtos/auth/auth-response.dto';

/**
 * User HTTP Mapper
 *
 * Convierte entidades de dominio a DTOs de respuesta HTTP.
 */
export class UserHttpMapper {
  /**
   * Convierte una entidad User a UserResponseDto
   */
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  static roleEntitiesToDtos(roles: Role[]): UserRoleDto[] {
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
    }));
  }

  /** Perfil / login: usuario + roles como entidades de dominio. */
  static toResponseWithRoleEntities(user: User, roles: Role[]): UserResponseDto {
    return {
      ...UserHttpMapper.toResponse(user),
      roles: UserHttpMapper.roleEntitiesToDtos(roles),
    };
  }

  /** Listados admin que vienen de `UserWithRolesListItem`. */
  static toResponseFromListItem(user: UserWithRolesListItem): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
    };
  }
}
