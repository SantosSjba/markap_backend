import { Inject, Injectable } from '@nestjs/common';
import { Application } from '../../../domain/entities/application.entity';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

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
