import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '@domain/repositories/role.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { ROLE_REPOSITORY } from '@common/constants/injection-tokens';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new EntityNotFoundException('Role', id);
    }
    return role;
  }
}
