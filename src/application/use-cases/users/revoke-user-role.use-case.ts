import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import type { RoleRepository } from '../../repositories/role.repository';

/**
 * Revoke Role from User Use Case
 * Clean Architecture: depends only on application port (RoleRepository).
 * The repository implementation throws if the user-role assignment does not exist.
 */
@Injectable()
export class RevokeUserRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(userId: string, roleId: string, revokedBy?: string) {
    const roles = await this.roleRepository.findByUserId(userId);
    const hasRole = roles.some((r) => r.id === roleId);
    if (!hasRole) {
      throw new NotFoundException('El usuario no tiene este rol asignado');
    }
    await this.roleRepository.revokeFromUser(userId, roleId, revokedBy);
    return { message: 'Rol revocado exitosamente' };
  }
}
