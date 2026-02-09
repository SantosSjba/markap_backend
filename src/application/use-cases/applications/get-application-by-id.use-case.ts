import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class GetApplicationByIdUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(id: string) {
    const application = await this.applicationRepository.findById(id);
    if (!application) {
      throw new EntityNotFoundException('Application', id);
    }
    return application;
  }
}
