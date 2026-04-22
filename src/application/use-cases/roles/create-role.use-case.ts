import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '@domain/repositories/role.repository';
import { DuplicateEntityException } from '@domain/exceptions';

import { ROLE_REPOSITORY } from '@common/constants/injection-tokens';

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: CreateRoleInput) {
    const existing = await this.roleRepository.findByCode(input.code);
    if (existing) {
      throw new DuplicateEntityException('Role', 'code', input.code);
    }
    return this.roleRepository.create({
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      deletedAt: null,
    });
  }
}
