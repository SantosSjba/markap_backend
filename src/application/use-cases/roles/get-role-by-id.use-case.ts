import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import { EntityNotFoundException } from '../../exceptions';

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
