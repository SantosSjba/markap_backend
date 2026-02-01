import { Injectable, Inject } from '@nestjs/common';
import { Application } from '../../entities';
import type { ApplicationRepository } from '../../repositories';
import { APPLICATION_REPOSITORY } from '../../repositories';

/**
 * Get All Applications Use Case
 * Returns all active applications (for admin purposes)
 */
@Injectable()
export class GetAllApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(): Promise<Application[]> {
    return this.applicationRepository.findAll();
  }
}
