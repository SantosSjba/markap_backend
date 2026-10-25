import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';

import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

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
