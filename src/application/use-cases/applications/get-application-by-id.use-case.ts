import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';

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
