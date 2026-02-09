import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface UpdateRoleInput {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: UpdateRoleInput) {
    const existing = await this.roleRepository.findById(input.id);
    if (!existing) {
      throw new EntityNotFoundException('Role', input.id);
    }
    const data: Partial<{ name: string; code: string; description: string | null; isActive: boolean }> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code;
    if (input.description !== undefined) data.description = input.description;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return this.roleRepository.update(input.id, data);
  }
}
