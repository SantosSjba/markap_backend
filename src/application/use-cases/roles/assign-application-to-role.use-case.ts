import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../repositories/role.repository';
import type {
  ApplicationRepository,
} from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface AssignApplicationToRoleInput {
  roleId: string;
  applicationId: string;
}

@Injectable()
export class AssignApplicationToRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: AssignApplicationToRoleInput): Promise<void> {
    const [role, application] = await Promise.all([
      this.roleRepository.findById(input.roleId),
      this.applicationRepository.findById(input.applicationId),
    ]);
    if (!role) throw new EntityNotFoundException('Role', input.roleId);
    if (!application) throw new EntityNotFoundException('Application', input.applicationId);
    await this.roleRepository.assignApplication(input.roleId, input.applicationId);
  }
}
