import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';

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
