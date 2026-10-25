import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { RoleRepository } from '../../../domain/repositories/role.repository';

import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository';

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
