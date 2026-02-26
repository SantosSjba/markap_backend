import { Injectable, Inject } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import type { RoleRepository } from '../../repositories/role.repository';

/**
 * Get All Roles Use Case
 * Clean Architecture: depends only on application port (RoleRepository).
 */
@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute() {
    return this.roleRepository.findAll();
  }
}
