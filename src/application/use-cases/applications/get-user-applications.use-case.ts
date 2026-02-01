import { Injectable, Inject } from '@nestjs/common';
import { Application } from '../../entities';
import type { ApplicationRepository } from '../../repositories';
import { APPLICATION_REPOSITORY } from '../../repositories';

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
