import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';

import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

@Injectable()
export class DeleteApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.applicationRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Application', id);
    }
    await this.applicationRepository.delete(id);
  }
}
