import { Injectable, Inject } from '@nestjs/common';
import { Application } from '@domain/entities';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';

/**
 * Get User Applications Use Case
 * Returns all applications that a user has access to based on their roles
 */
@Injectable()
export class GetUserApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(userId: string): Promise<Application[]> {
    return this.applicationRepository.findByUserId(userId);
  }
}
