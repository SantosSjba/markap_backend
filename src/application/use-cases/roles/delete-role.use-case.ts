import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import { EntityNotFoundException } from '../../exceptions';

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
