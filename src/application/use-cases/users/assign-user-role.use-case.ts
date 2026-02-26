import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import type { RoleRepository } from '../../repositories/role.repository';

/**
 * Assign Role to User Use Case
 * Clean Architecture: depends only on application ports (UserRepository, RoleRepository).
 */
@Injectable()
export class AssignUserRoleUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(userId: string, roleId: string, assignedBy?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    await this.roleRepository.assignToUser(userId, roleId, assignedBy);
    return { message: 'Rol asignado exitosamente' };
  }
}
