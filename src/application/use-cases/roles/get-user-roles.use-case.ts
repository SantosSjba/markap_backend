import { Injectable, Inject } from '@nestjs/common';
import { Role } from '../../entities';
import type { RoleRepository } from '../../repositories';
import { ROLE_REPOSITORY } from '../../repositories';

/**
 * Get User Roles Use Case
 * Returns all roles assigned to a user
 */
@Injectable()
export class GetUserRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(userId: string): Promise<Role[]> {
    return this.roleRepository.findByUserId(userId);
  }
}
