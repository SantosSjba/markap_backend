import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '@domain/repositories/role.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { ROLE_REPOSITORY } from '@common/constants/injection-tokens';

export interface RevokeApplicationFromRoleInput {
  roleId: string;
  applicationId: string;
}

@Injectable()
export class RevokeApplicationFromRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: RevokeApplicationFromRoleInput): Promise<void> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role) throw new EntityNotFoundException('Role', input.roleId);
    await this.roleRepository.revokeApplication(input.roleId, input.applicationId);
  }
}
