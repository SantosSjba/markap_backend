import { Inject, Injectable } from '@nestjs/common';
import { Application } from '../../../domain/entities/application.entity';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

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
