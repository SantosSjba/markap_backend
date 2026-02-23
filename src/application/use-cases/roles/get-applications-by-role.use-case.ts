import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import type { Application } from '../../entities';

/**
 * Get applications assigned to a role (role-applications access control).
 */
@Injectable()
export class GetApplicationsByRoleUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(roleId: string): Promise<Application[]> {
    return this.applicationRepository.findByRoleId(roleId);
  }
}
