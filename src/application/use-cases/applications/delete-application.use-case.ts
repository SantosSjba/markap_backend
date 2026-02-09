import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

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
