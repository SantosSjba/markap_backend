import { Injectable, Inject } from '@nestjs/common';
import { ROLE_REPOSITORY } from '@common/constants/injection-tokens';
import type { RoleRepository } from '@domain/repositories/role.repository';

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
