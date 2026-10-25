import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { RoleRepository } from '../../../domain/repositories/role.repository';

import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Role', id);
    }
    await this.roleRepository.delete(id);
  }
}
