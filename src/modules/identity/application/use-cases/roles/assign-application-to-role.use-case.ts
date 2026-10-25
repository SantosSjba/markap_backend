import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';
import type { RoleRepository } from '../../../domain/repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository';

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
    if (!application)
      throw new EntityNotFoundException('Application', input.applicationId);
    await this.roleRepository.assignApplication(
      input.roleId,
      input.applicationId,
    );
  }
}
