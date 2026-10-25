import { Inject, Injectable } from '@nestjs/common';
import type { Application } from '../../../domain/entities/application.entity';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

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
